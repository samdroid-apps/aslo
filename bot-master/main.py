import os
import time
import json
import uuid
import threading
from subprocess import call

from flask import Flask, jsonify, abort, request, send_from_directory
import rethinkdb as r
from helpers import crossdomain

conn = r.connect('localhost', 28015)
repos = r.db('bot_master').table('repos')

tasks_todo = {}  # bundle_id -> extra data
tasks_sent = {}  # bundle_id -> code

tasks_todo_lock = threading.Lock()
git_lock = threading.Lock()

UPLOADS_FOLDER = '../uploads/'
if not os.path.isdir(UPLOADS_FOLDER):
    os.mkdir('../uploads')

MY_ADDR = 'http://localhost:5001'

def verify_repo(gh_user, gh_repo, bundle_id):
    d = repos.get(bundle_id).run(conn)
    if d == None:
        repos.insert([{'ghUser': gh_user, 'ghRepo': gh_repo,
                       'id': bundle_id}]).run(conn)
        return True
    return d['ghUser'].lower() == gh_user.lower() and \
           d['ghRepo'].lower() == gh_repo.lower()

app = Flask(__name__)

@app.route('/hook/<gh_user>/<gh_repo>/<bundle_id>', methods=['POST'])
def hook(gh_user, gh_repo, bundle_id):
    with open('data.json') as f:
        data = json.loads(f.read())
    if not bundle_id in data['activities']:
        return ("Please add your thing first to our github, "
                "then the bots will come and help you fill it out\n")

    if not verify_repo(gh_user, gh_repo, bundle_id):
        return ("You are using a different repo to the first one you used.\n\n"
                "If this is an error in our system or "
                "you really have made a change "
                "**please create a github issue about it!**\n")
        
    print 'Hook call from', bundle_id
    task_id = str(uuid.uuid4())
    tasks_sent[bundle_id] = task_id

    with tasks_todo_lock:
        tasks_todo[bundle_id] = {'task_id': task_id,
                                 'gh': gh_user + '/' + gh_repo}

    return "Cool Potatoes"

@app.route('/pull', methods=['GET', 'POST'])
def pull():
    """Go here every time a new activity is added to refresh the data"""
    with git_lock:
        call(['git', 'pull'])
    return "Cool Potatoes"

@app.route('/task')
def get_task():
    with tasks_todo_lock:
        ts = tasks_todo.items()
        if ts:
          t = ts.pop(0)
          del tasks_todo[t[0]]
          return jsonify(bundle_id=t[0],
                         task_id=t[1]['task_id'],
                         gh=t[1]['gh'])
        else:
             abort(404)

@app.route('/done', methods=['POST'])
def done():
    data = request.get_json()
    bundle_id = data['bundle_id']
    task_id = data['task_id']
    if not tasks_sent.get(bundle_id, None) == task_id:
      return "Bad code :("

    # LOCK
    git_lock.aquire()

    call(['git', 'pull'])
    with open('data.json') as f:
        current = json.loads(f.read())
    
    if not bundle_id in current['activities']:
        current['activities'][bundle_id] = {}

    file_ = data['file'].decode('base64')
    if file_:
        v = data['result']['version']
        sp = os.path.join(UPLOADS_FOLDER, bundle_id + '_stable.xo')
        if (current['activities'][bundle_id].get('version') != v and v) or \
            not os.path.isfile(sp):
                with open(sp, 'wb') as f:
                    f.write(file_)
                data['result']['xo_url_timestamp'] = time.time()
        lp = os.path.join(UPLOADS_FOLDER, bundle_id + '_latest.xo')
        with open(lp, 'wb') as f:
            f.write(file_)

        data['result']['xo_url'] = \
            '%s/uploads/%s_stable.xo' % (MY_ADDR, bundle_id)
        data['result']['xo_url_latest'] = \
            '%s/uploads/%s_latest.xo' % (MY_ADDR, bundle_id)
        data['result']['xo_url_latest_timestamp'] = time.time()

    current['activities'][bundle_id].update(data['result'])

    text = json.dumps(current, indent=4, sort_keys=True)
    with open('data.json', 'w') as f:
        f.write(text)
    call(['git', 'add', 'data.json'])
    call(['git', 'commit', '-m',
          'Bot from %s updated %s' % (request.remote_addr, bundle_id)])
    call(['git', 'push'])

    git_lock.release()
    return "Cool Potatoes"

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    p = os.path.join(UPLOADS_FOLDER, filename)
    if os.path.isfile(p):
        with open(p, 'rb') as f:
            b = f.read()
        return b
    abort(404)

@app.route('/data.json', methods=['GET', 'POST'])
@crossdomain(origin='*')
def get_data():
    with open('data.json') as f:
        j = f.read()
    return app.response_class(j, mimetype='application/json')

@app.route('/port')
def get_port():
    return "Please update to the latest bot"

debug = os.path.isfile('../debug')
app.run(port=5001, debug=debug)
