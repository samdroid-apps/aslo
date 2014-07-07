import json
import time
import uuid
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
from mailer import Mailer
from token_object import TokenObject

DATA_JSON = 'http://aslo-bot-master.sugarlabs.org/data.json'
auths = {}  # User => TokenObject
MD_CONTEXT = 'sugarlabs/sugar'

conn = r.connect('localhost', 28015)
comments = r.db('comments').table('comments')
emails = r.db('comments').table('emails')
users = r.db('comments').table('users')

mailer = Mailer()

app = Flask(__name__)


### Login Stuff ###

@app.route('/signup', methods=['POST'])
@crossdomain(origin='*')
def signup():
    global auths
    if users.get(request.form['username']).run(conn):
        return jsonify(error=True, msg="The username is already used")

    if not request.form['username'] or \
       not request.form['password'] or \
       not request.form['secret'] or \
       not request.form['colors']:
       return jsonify(error=True, msg="Please fill out all the fields")

    salt = str(uuid.uuid4())
    hash_ = hashlib.sha1(request.form['password'] + salt).hexdigest()

    users.insert({
        'salt': salt, 'password_hash': hash_, 
        'id': request.form['username'],
        'secret': request.form['secret'],
        'colors': request.form['colors']}).run(conn)

    t = TokenObject()
    auths[request.form['username']] = t
    return jsonify(error=False, token=str(t))


@app.route('/login', methods=['POST'])
@crossdomain(origin='*')
def login():
    global auths
    user = users.get(request.form['username']).run(conn)
    if user is None:
        return jsonify(error=True, msg="Can't find your username")

    hash_ = hashlib.sha1(request.form['password'] + user['salt']).hexdigest()
    if hash_ == user['password_hash']:
        t = TokenObject()
        auths[user['id']] = t
        return jsonify(error=False, token=str(t))

    return jsonify(error=True, msg="Wrong password")





### Posting A Comment ###

@app.route('/comments/post', methods=['POST'])
@crossdomain(origin='*')
def post():
    global auths
    username = request.form['username']
    token = request.form['token']
    if not auths.get(username) or not auths.get(username).is_valid(token):
        abort(400)

    colors = users.get(username).run(conn)['colors']

    text = request.form['content']
    dataS = json.dumps({'text': text, 'mode': 'gfm', 'context': MD_CONTEXT})
    resp = requests.post("https://api.github.com/markdown", data=dataS)
    if not resp.ok:
        abort(500)
    html = resp.text

    # Only 1 review per email
    if request.form['type'] == 'review':
        review = comments.filter({'user': username,
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
                'user': username,
                'colors': colors,
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
                              'deleted': False}).order_by('time').run(conn)
    return json.dumps(list(result))





### Reporting ###

@app.route('/comments/report', methods=['POST'])
@crossdomain(origin='*')
def report():
    id_ =  request.form['id']

    c = comments.get(id_).run(conn)
    comments.get(id_).update({'flagged': True}).run(conn)

    mailer.send(id_, c['text'], c['user'], c['bundle_id'])

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
