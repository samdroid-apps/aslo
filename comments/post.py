import time
import json

import requests
from flask import jsonify, request, abort
import rethinkdb as r

from accounts import verify_login
from get import stream

conn = r.connect('localhost', 28015)
comments = r.db('comments').table('comments')
users = r.db('comments').table('users')

MD_CONTEXT = 'sugarlabs/sugar'

def post():
  try:
    verify_login()

    username = request.form['username']
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
            stream.remove_comment(deleted_id)
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
    stream.add_comment(added_obj)
    return 'Cool Potatos'
  except Exception as e:
    print e
