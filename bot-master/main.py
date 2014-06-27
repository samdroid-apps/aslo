import os
import time
import json
import uuid
import threading
from subprocess import call

from flask import Flask, jsonify, abort, request, send_from_directory, Response
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

LOG_FOLDER = '../logs/'
if not os.path.isdir(LOG_FOLDER):
    os.mkdir('../logs')

MY_ADDR = 'http://aslo-bot-master.sugarlabs.org'

with open('data.json') as f:
    data_json_cache = f.read()

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
    global data_json_cache
    data = json.loads(data_json_cache)
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
    global data_json_cache
    with git_lock:
        call(['git', 'pull'])
    with open('data.json') as f:
        data_json_cache = f.read()
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
    global data_json_cache

    data = request.get_json()
    if not 'releases' in data['result']:
        data['result']['releases'] = []

    bundle_id = data['bundle_id']
    task_id = data['task_id']
    if not tasks_sent.get(bundle_id, None) == task_id:
      return "Bad code :("

    # LOCK
    git_lock.acquire()

    call(['git', 'pull'])
    with open('data.json') as f:
        data_json_cache = f.read()
        current = json.loads(data_json_cache)
    
    if not bundle_id in current['activities']:
        current['activities'][bundle_id] = {}

    file_ = data['file'].decode('base64')
    if file_:
        v = data['result']['version']
        sp = os.path.join(UPLOADS_FOLDER,
                          '{}_stable_{}.xo'.format(bundle_id, v))
        if not os.path.isfile(sp):
            # If we havn't written version V
            with open(sp, 'wb') as f:
                f.write(file_)
            data['result']['xo_url_timestamp'] = time.time()

        lp = os.path.join(UPLOADS_FOLDER, bundle_id + '_latest.xo')
        with open(lp, 'wb') as f:
            f.write(file_)

        data['result']['xo_url'] = \
            '{}/uploads/{}_stable_{}.xo'.format(MY_ADDR, bundle_id, v)
        data['result']['xo_url_latest'] = \
            '{}/uploads/{}_latest.xo'.format(MY_ADDR, bundle_id)
        data['result']['xo_url_latest_timestamp'] = time.time()

        new_v_data = {'xo_url': data['result']['xo_url'],
                      'version': v,
                      'minSugarVersion': data['result'].get('minSugarVersion'),
                      'whats_new': data['result'].get('whats_new', {}),
                      'screenshots': data['result'].get('screenshots', [])}
        data['result']['releases'].insert(0, new_v_data)

    current['activities'][bundle_id].update(data['result'])

    text = json.dumps(current, indent=4, sort_keys=True)
    with open('data.json', 'w') as f:
        f.write(text)
    data_json_cache = text

    call(['git', 'add', 'data.json'])
    call(['git', 'commit', '-m',
          'Bot from %s updated %s' % (request.remote_addr, bundle_id)])
    call(['git', 'push'])

    git_lock.release()
    return "Cool Potatoes"

def log_dl(filename, ip):
    fn = '_'.join([str(i) for i in time.gmtime()[:3]]) + '_downloads.log'
    fp = os.path.join(LOG_FOLDER, fn)
    mode = 'a' if os.path.isfile(fp) else 'w'
    with open(fp, mode) as f:
        f.write("{}: {} {}\n".format(time.gmtime()[3:6], ip, filename))

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    p = os.path.join(UPLOADS_FOLDER, filename)
    if os.path.isfile(p):
        log_dl(filename, request.remote_addr)
        with open(p, 'rb') as f:
            b = f.read()
        return Response(b, mimetype='application/vnd.olpc-sugar')
    abort(404)

@app.route('/data.json', methods=['GET', 'POST'])
@crossdomain(origin='*')
def get_data():
    global data_json_cache
    return app.response_class(data_json_cache, mimetype='application/json')

@app.route('/port')
def get_port():
    return "Please update to the latest bot"

debug = os.path.isfile('../debug')
app.run(port=5001, debug=debug)
