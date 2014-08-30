import json

from flask import jsonify, request, abort
import rethinkdb as r

from accounts import verify_admin_login

conn = r.connect('localhost', 28015)
comments = r.db('comments').table('comments')

def report():
    id_ =  request.form['id']

    c = comments.get(id_).run(conn)
    comments.get(id_).update({'flagged': True}).run(conn)

    return 'Reported'

def get_flagged():
    verify_admin_login()
    if comments.filter({'flagged': True}).is_empty().run(conn):
        return json.dumps({'empty': True})
    return json.dumps({
        'empty': False,
        'data': comments.filter({'flagged': True, 'deleted': False}).nth(0).run(conn)})


def unflag(id_):
    verify_admin_login()
    comments.get(id_).update({'flagged': False, 'deleted': False}).run(conn)
    return '[SUCCESS] Comment no longer flagged'


def delete(id_):
    verify_admin_login()
    comments.get(id_).update({'flagged': False, 'deleted': True}).run(conn)
    return '[SUCCESS] Comment hidden'
