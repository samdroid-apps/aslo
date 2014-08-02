import os
import time
import json
import uuid
import threading
from subprocess import call

from flask import Flask, jsonify, abort, request, send_from_directory, Response
from helpers import crossdomain

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

def verify_repo(gh, bundle_id):
    with open(bundle_id + '.json') as f:
        try:
            j = json.load(f)
        except ValueError:
            return False

        if not 'github_url' in j:
            return True
        return j['github_url'] == gh

app = Flask(__name__)

@app.route('/hook/<gh_user>/<gh_repo>/<bundle_id>', methods=['POST'])
def hook(gh_user, gh_repo, bundle_id):
    if not os.path.isfile(bundle_id + '.json'):
        return ("Please add your thing first to our github, "
                "then the bots will come and help you fill it out\n")

    if not verify_repo('{}/{}'.format(gh_user, gh_repo), bundle_id):
        return ("You are using a different repo to the first one you used"
                " OR the json in your file is invalid!\n\n"
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
    if not 'releases' in data['result']:
        data['result']['releases'] = []

    bundle_id = data['bundle_id']
    task_id = data['task_id']
    if not tasks_sent.get(bundle_id, None) == task_id:
      return "Bad code :("

    # LOCK
    git_lock.acquire()

    call(['git', 'pull'])
    with open(bundle_id + '.json') as f:
        current = json.load(f)
    result = data['result']

    file_ = data['file'].decode('base64')
    if file_:
        v = result['version']
        sp = os.path.join(UPLOADS_FOLDER,
                          '{}_stable_{}.xo'.format(bundle_id, v))
        if not os.path.isfile(sp):
            # If we havn't written version V
            with open(sp, 'wb') as f:
                f.write(file_)
           result['xo_url_timestamp'] = time.time()

        lp = os.path.join(UPLOADS_FOLDER, bundle_id + '_latest.xo')
        with open(lp, 'wb') as f:
            f.write(file_)

        result['xo_url'] = \
            '{}/uploads/{}_stable_{}.xo'.format(MY_ADDR, bundle_id, v)
        result['xo_url_latest'] = \
            '{}/uploads/{}_latest.xo'.format(MY_ADDR, bundle_id)
        result['xo_url_latest_timestamp'] = time.time()

        new_v_data = {'xo_url': result['xo_url'],
                      'version': v,
                      'minSugarVersion': result.get('minSugarVersion'),
                      'whats_new': result.get('whats_new', {}),
                      'screenshots': result.get('screenshots', [])}
        result['releases'].insert(0, new_v_data)

    current.update(result)

    with open(bundle_id + '.json', 'w') as f:
        json.dump(current, f, indent=4, sort_keys=True)

    call(['git', 'add', bundle_id + '.json'])
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
        return Response(b, mimetype='application/vnd.olpc-sugar')
    abort(404)

debug = os.path.isfile('../debug')
app.run(port=5001, debug=debug)
