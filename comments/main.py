import json
import time
import hashlib

from flask import Flask, jsonify, abort, request
import rethinkdb as r
import requests

from twisted.internet import reactor
from twisted.web.wsgi import WSGIResource
from twisted.web.server import Site
from twisted.internet.protocol import Factory
from twisted.protocols.basic import LineReceiver
from txws import WebSocketFactory

from helpers import crossdomain
from mailer import Mailer, ReplyMailer

SITE_URL = 'http://0.0.0.0:8000'
DATA_JSON = 'http://aslo-bot-master.sugarlabs.org/data.json'
auths = {}  # Email => Assertion
MD_CONTEXT = 'sugarlabs/sugar'

conn = r.connect('localhost', 28015)
comments = r.db('comments').table('comments')
emails = r.db('comments').table('emails')

mailer = Mailer()
reply_mailer = ReplyMailer()

app = Flask(__name__)


### Login Stuff ###


@app.route('/login', methods=['POST'])
@crossdomain(origin='*')
def login():
    if 'assertion' not in request.form:
        abort(400)

    payload = {'assertion': request.form['assertion'], 'audience': SITE_URL}
    i = requests.post('https://verifier.login.persona.org/verify',
                      data=payload, verify=True)

    if i.ok:
        resp = i.json()
        if resp['status'] == 'okay':
            auths[resp['email']] = request.form['assertion']
            return i.text

    abort(500)





### Posting A Comment ###

@app.route('/comments/post', methods=['POST'])
@crossdomain(origin='*')
def post():
    print 1
    email = request.form['email']
    assertion = request.form['code']
    if auths.get(email) != assertion:
        abort(400)

    email_hash = hashlib.md5(request.form['email']).hexdigest()

    text = request.form['content']
    dataS = json.dumps({'text': text, 'mode': 'gfm', 'context': MD_CONTEXT})
    resp = requests.post("https://api.github.com/markdown", data=dataS)
    if not resp.ok:
        abort(500)
    html = resp.text

    # Only 1 review per email
    if request.form['type'] == 'review':
        review = comments.filter({'email': request.form['email'],
            'bundle_id': request.form['bundle_id'],
            'type': 'review'})
        try:
            deleted_id = list(review.run(conn))[0]['id']
        except IndexError:
            # Caused when there is nothing to delete
            pass
        else:
            comment_stream.remove_comment(deleted_id)
            review.delete().run(conn)

    f = request.form
    added_obj = {
                'email_hash': email_hash,
                'email': f['email'],
                'bundle_id': f['bundle_id'],

                'type': f['type'],
                'text': html,
                'rating': int(f['rating']),

                'reply_id': f.get('reply_id'),
                'reply_content': f.get('reply_content'),

                'time': time.time(),
                'flagged': False,
                'deleted': False,
                'lang': f['lang']
               }
    added_obj['id'] = comments.insert(added_obj).run(conn)['generated_keys'][0]
    comment_stream.add_comment(added_obj)
    return 'Cool Potatos'






### Sockets to keep people updated ###

class CommentStreamP(LineReceiver):
    def __init__(self, factory):
        self.f = factory

    def connectionMade(self):
        self.f.sockets[id(self)] = self
        print "Joined", id(self)

    def connectionLost(self, reason):
        print "Left", id(self), reason
        del self.f.sockets[id(self)]


class CommentStreamF(Factory):
    sockets = {}

    def buildProtocol(self, addr):
        return CommentStreamP(self)

    def add_comment(self, comment_json):
        data = json.dumps({'event': 'add_comment', 'data':comment_json})
        for i in self.sockets.values():
            i.sendLine(data)

    def remove_comment(self, comment_id):
        data = json.dumps({'event': 'remove_comment', 'data':comment_id})
        for i in self.sockets.values():
            i.sendLine(data)

comment_stream = CommentStreamF()







### Get the comments ###

@app.route('/comments/get/<bundle_id>', methods=['GET', 'POST'])
@crossdomain(origin='*')
def get(bundle_id):
    if bundle_id == '' or bundle_id == 'undefined':
        abort(400)

    result = comments.filter({'bundle_id': bundle_id,
                              'flagged': False,
                              'deleted': False}).order_by('time').pluck(
                              'text', 'rating', 'email_hash', 'id', 'type',
                              'is_reply', 'reply_id', 'reply_content').run(conn)
    return json.dumps(list(result))





### Reporting ###

@app.route('/comments/report', methods=['POST'])
@crossdomain(origin='*')
def report():
    id_ =  request.form['id']

    c = comments.get(id_).run(conn)
    comments.get(id_).update({'flagged': True}).run(conn)

    mailer.send(id_, c['text'], c['email'])

    return 'Reported'

@app.route('/comments/keep/<id_>/<pw>')
def keep(id_, pw):
    if emails.get(id_).run(conn)['pw'] != pw:
        return '[FAIL] Wrong password... Maybe a STALE EMAIL'

    comments.get(id_).update({'flagged': False, 'deleted': False}).run(conn)
    return '[SUCCESS] Comment no longer flagged'

@app.route('/comments/kill/<id_>/<pw>')
def kill(id_, pw):
    if emails.get(id_).run(conn)['pw'] != pw:
        return '[FAIL] Wrong password... Maybe a STALE EMAIL'

    comments.get(id_).update({'flagged': False, 'deleted': True}).run(conn)
    return '[SUCCESS] Comment hidden'





resource = WSGIResource(reactor, reactor.getThreadPool(), app)
site = Site(resource)
reactor.listenTCP(5000, site)

reactor.listenTCP(9999, WebSocketFactory(comment_stream))

reactor.run()
