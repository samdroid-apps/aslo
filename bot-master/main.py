# Copyright (C) Sam Parkinson 2014
#
# This file is part of ASLO.
#
# ASLO is free software: you can redistribute it and/or modify it under
# the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# ASLO is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with ASLO.  If not, see <http://www.gnu.org/licenses/>.

import os
import time
import json
import uuid
import shutil
import threading
from subprocess import call

from flask import Flask, jsonify, abort, request


tasks_todo = {}  # bundle_id -> extra data
tasks_sent = {}  # bundle_id -> code

tasks_todo_lock = threading.Lock()
git_lock = threading.Lock()

OUT_FOLDER = 'out'
if not os.path.isdir(OUT_FOLDER):
    os.mkdir('out')

DOWNLOADS_ROOT = os.environ.get('ASLO_DOWNLOADS_ROOT')


def verify_repo(gh, bundle_id):
    with open('git/{}.json'.format(bundle_id)) as f:
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
    if not os.path.isfile('git/{}.json'.format(bundle_id)):
        return ('Please add your activity first to our github, '
                'then the bots will come and help you fill it out\n')

    if not verify_repo('{}/{}'.format(gh_user, gh_repo), bundle_id):
        return ('You are using a different repo to the first one you used'
                ' OR the json in your file is invalid!\n\n'
                'If this is an error in our system or '
                'you really have made a change '
                '**please create a github issue about it!**\n'
                'https://github.com/samdroid-apps/sugar-activities')

    print 'Hook call from', bundle_id
    task_id = str(uuid.uuid4())
    tasks_sent[bundle_id] = task_id

    with tasks_todo_lock:
        tasks_todo[bundle_id] = {'task_id': task_id,
                                 'gh': gh_user + '/' + gh_repo}

    return 'Cool Potatoes'


@app.route('/pull', methods=['GET', 'POST'])
def pull():
    with git_lock:
        os.chdir('git')
        call(['git', 'pull'])
        os.chdir('..')
    return 'Cool Potatoes'


@app.route('/task')
def get_task():
    with tasks_todo_lock:
        tasks = tasks_todo.items()
        if tasks:
          t = tasks.pop(0)
          del tasks_todo[t[0]]
          return jsonify(bundle_id=t[0],
                         task_id=t[1]['task_id'],
                         gh=t[1]['gh'])
        else:
             abort(404)


@app.route('/done', methods=['POST'])
def old_done():
    return 'Deprecated, please update your bot'


@app.route('/done2', methods=['POST'])
def done():
    data = json.load(request.files['json'].stream)
    result = data['result']

    bundle_id = data['bundle_id']
    task_id = data['task_id']
    if not tasks_sent.get(bundle_id, None) == task_id:
      return "Bad code :("

    file_ = request.files['bundle']
    version = result['version']
    timestamp = int(time.time())
    stable = '{}_v{}.xo'.format(bundle_id, version)
    unstable = '{}_{}.xo'.format(bundle_id, timestamp)
    stable_path = os.path.join(OUT_FOLDER, stable)
    unstable_path = os.path.join(OUT_FOLDER, unstable)

    os.chdir('git')
    git_lock.acquire()
    call(['git', 'pull'])

    current = json.load(open(bundle_id + '.json'))
    if 'releases' not in result:
        result['releases'] = current.get('releases', [])
    os.chdir('..')

    if not os.path.isfile(stable):
        # If we havn't written this version
        file_.save(stable_path)
        result['xo_url_timestamp'] = timestamp
        result['xo_url'] = '{}/{}'.format(DOWNLOADS_ROOT, stable)
        result['xo_size'] = os.path.getsize(stable_path)

        new_version = {'xo_url': stable,
                       'version': version,
                       'minSugarVersion': result.get('minSugarVersion'),
                       'whats_new': result.get('whats_new', {}),
                       'screenshots': result.get('screenshots', {})}
        result['releases'].insert(0, new_version)

        shutil.copy(stable_path, unstable_path)
    else:
        file_.save(unstable_path)
    result['xo_url_latest'] = '{}/{}'.format(DOWNLOADS_ROOT, unstable)
    result['xo_url_latest_timestamp'] = timestamp

    os.chdir('git')
    current.update(result)
    with open(bundle_id + '.json', 'w') as f:
        json.dump(current, f, indent=4, sort_keys=True)

    call(['git', 'add', bundle_id + '.json'])
    call(['git', 'commit', '-m',
          'Bot from %s updated %s' % (
              request.headers.get('X-Forwarded-For', '?'),
              bundle_id)])
    call(['git', 'push'])

    git_lock.release()
    os.chdir('..')
    return 'You just did a task... congrats!'

debug = os.path.isfile('debug')
app.run(port=5001, debug=debug, host='0.0.0.0')
