import json
import time
import hashlib

from flask import Flask, jsonify, abort, request
import rethinkdb as r
import requests

from helpers import crossdomain
from mailer import Mailer

SITE_URL = 'http://0.0.0.0:8000'
auths = {}  # Email => Assertion

conn = r.connect('localhost', 28015)
comments = r.db('comments').table('comments')
emails = r.db('comments').table('emails')

mailer = Mailer()

app = Flask(__name__)

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

@app.route('/comments/post', methods=['POST'])
@crossdomain(origin='*')
def post():
    email = request.form['email']
    assertion = request.form['code']
    if auths.get(email) != assertion:
        abort(400)

    email_hash = hashlib.md5(request.form['email']).hexdigest()

    # Only 1 review per email
    comments.filter({'email': request.form['email'],
                 'bundle_id': request.form['bundle_id'],}).delete().run(conn)

    comments.insert({'email_hash': email_hash,
                     'email': request.form['email'],
                     'bundle_id': request.form['bundle_id'],
                     'text': request.form['content'],
                     'rating': int(request.form['rating']),
                     'time': time.time(),
                     'flagged': False,
                     'deleted': False,
                     }).run(conn)
    return 'Cool Potatos'

@app.route('/comments/get/<bundle_id>', methods=['GET', 'POST'])
@crossdomain(origin='*')
def get(bundle_id):
    if bundle_id == '':
        abort(400)

    result = comments.filter({'bundle_id': bundle_id,
                              'flagged': False,
                              'deleted': False}).order_by('time').pluck(
                              'text', 'rating', 'email_hash', 'id').run(conn)
    return json.dumps(list(result))

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

app.run(debug=True)
