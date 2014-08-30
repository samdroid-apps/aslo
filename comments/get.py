import time
import json

from twisted.internet import reactor
from twisted.web.wsgi import WSGIResource
from twisted.web.server import Site
from twisted.internet.protocol import Factory
from twisted.protocols.basic import LineReceiver
from txws import WebSocketFactory
from flask import jsonify, request, abort
import rethinkdb as r

from accounts import verify_login

conn = r.connect('localhost', 28015)
comments = r.db('comments').table('comments')
users = r.db('comments').table('users')

def get(bundle_id):
    if bundle_id == '' or bundle_id == 'undefined':
        abort(400)

    result = comments.filter({'bundle_id': bundle_id,
                              'flagged': False,
                              'deleted': False}).order_by('time').run(conn)
    return json.dumps(list(result))


class CommentStreamP(LineReceiver):
    def __init__(self, factory):
        self.f = factory

    def connectionMade(self):
        self.f.sockets[id(self)] = self

    def connectionLost(self, reason):
        del self.f.sockets[id(self)]


class CommentStreamF(Factory):
    sockets = {}

    def buildProtocol(self, addr):
        return CommentStreamP(self)

    def add_comment(self, comment_json):
        data = json.dumps({'event': 'add_comment', 'data': comment_json})
        for i in self.sockets.values():
            i.sendLine(data)

    def remove_comment(self, comment_id):
        data = json.dumps({'event': 'remove_comment', 'data': comment_id})
        for i in self.sockets.values():
            i.sendLine(data)

try:
    stream
except NameError:
    stream = CommentStreamF()
