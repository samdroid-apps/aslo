import time
import uuid
import hashlib

from flask import jsonify, request, abort
import rethinkdb as r

conn = r.connect('localhost', 28015)
users = r.db('comments').table('users')

# User -> TokenObject
tokens = {}

# 3 hours in Seconds
EXPIRE_TIME = 60 * 60 * 3


class TokenObject():
    def __init__(self):
        self._expire_time = time.time() + EXPIRE_TIME
        self._string = str(uuid.uuid4())

    def __str__(self):
        return self._string

    def is_valid(self, other):
        if time.time() > self._expire_time:
             return False

        return other == self._string


def new_user():
    global tokens
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
    tokens[request.form['username']] = t
    return jsonify(error=False, token=str(t))


def login():
    global tokens
    user = users.get(request.form['username']).run(conn)
    if user is None:
        return jsonify(error=True, msg="Can't find your username")

    hash_ = hashlib.sha1(request.form['password'] + user['salt']).hexdigest()
    if hash_ == user['password_hash']:
        t = TokenObject()
        tokens[user['id']] = t
        return jsonify(error=False, token=str(t))

    return jsonify(error=True, msg="Wrong password")


def verify_login():
    global tokens
    username = request.form['username']
    token = request.form['token']
    if not tokens.get(username) or not tokens.get(username).is_valid(token):
        abort(400)
    return True

def verify_admin_login():
    if verify_login():
        user = users.get(request.form['username']).run(conn)
        if user.get('admin', False):
            return True
    abort(400)
