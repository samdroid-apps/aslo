from flask import Flask

from twisted.internet import reactor
from twisted.web.wsgi import WSGIResource
from twisted.web.server import Site
from txws import WebSocketFactory

from helpers import crossdomain
from mailer import Mailer
from accounts import login, new_user, verify_login
from post import post
from get import get, stream
from flag import report, get_flagged, delete, unflag

app = Flask(__name__)

app.route('/signup', methods=['POST'])(
    crossdomain(origin='*')(new_user))
app.route('/login', methods=['POST'])(
    crossdomain(origin='*')(login))


app.route('/comments/post', methods=['POST'])(
    crossdomain(origin='*')(post))
app.route('/comments/get/<bundle_id>', methods=['GET', 'POST'])(
    crossdomain(origin='*')(get))


app.route('/comments/report', methods=['POST'])(
    crossdomain(origin='*')(report))
app.route('/comments/flagged')(get_flagged)
app.route('/comments/unflag/<id_>')(unflag)
app.route('/comments/delete/<id_>')(delete)


resource = WSGIResource(reactor, reactor.getThreadPool(), app)
site = Site(resource)
reactor.listenTCP(5000, site)
reactor.listenTCP(9999, WebSocketFactory(stream))
reactor.run()
