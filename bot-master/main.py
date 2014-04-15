import socket
import sys
import os
import thread
import json
import uuid
import random
from subprocess import call

from flask import Flask, jsonify, abort, request
import rethinkdb as r

conn = r.connect('localhost', 28015)
bots = r.db('bot_master').table('bots')
repos = r.db('bot_master').table('repos')

bot_sockets = {}
tasks_sent = {}

def get_new_bot():
  # FIXME
  return random.choice(bot_sockets.keys())

def get_bot_for_repo(bundle_id, gh_user, gh_repo):
    result = repos.get(bundle_id).run(conn)
    if result:
        bot_addr = result['lastBot']
        if bot_addr in bot_sockets:
            return bot_sockets[bot_addr]
        else:
            new = get_new_bot()
            repos.get(bundle_id).update({'lastBot': new}).run(conn)
            return bot_sockets[new]
    else:
        new = get_new_bot()
        repos.insert([{'ghUser': gh_user, 'ghRepo': gh_repo,
                       'id': bundle_id, 'lastBot': new}]).run(conn)
        return bot_sockets[new]

app = Flask(__name__)

@app.route('/hook/<gh_user>/<gh_repo>/<bundle_id>', methods=['POST'])
def hook(gh_user, gh_repo, bundle_id):
    print 'Hook call from', bundle_id
    task_id = str(uuid.uuid4())
    tasks_sent[bundle_id] = task_id

    s = get_bot_for_repo(bundle_id, gh_user, gh_repo)
    s.send('TASK/%s/%s/%s/%s/' % (task_id, bundle_id, gh_user, gh_repo))

    return "Cool Potatos"

@app.route('/done', methods=['POST'])
def done():
    data = request.get_json()
    bundle_id = data['bundle_id']
    task_id = data['task_id']
    if not tasks_sent.get(bundle_id, None) == task_id:
      return "Bad code :("

    call(['git', 'pull'])
    with open('data.json') as f:
        current = json.loads(f.read())
    
    if not bundle_id in current['activities']:
        current['activities'][bundle_id] = {}
    current['activities'][bundle_id].update(data['result'])
    
    text = json.dumps(current, indent=4, sort_keys=True)
    with open('data.json', 'w') as f:
        f.write(text)
    call(['git', 'add', 'data.json'])
    call(['git', 'commit', '-m',
          'Bot from %s updated %s' % (request.remote_addr, bundle_id)])
    return "Cool Potatos"

def auth_socket(s, addr):
    id_string = addr[0]

    i = bots.get(id_string).run(conn)
    if i:
      s.send('pw?')
      pw = s.recv(1024).strip()
      if pw == i['pw']:
        bot_sockets[id_string] = s
      else:
        s.close()
    else:
      pw = str(uuid.uuid4())
      s.send('pw=' + pw)
      s.recv(1024)
      bots.insert([{'id': id_string, 'pw': pw}]).run(conn)
      bot_sockets[id_string] = s

    print "Authed bot @", id_string
    
    while True:
        msg = s.recv(1024).strip()
        if msg == "CLOSE":
          return

port = 0

@app.route('/port')
def get_port():
    return str(port)

def run_sockets():
    global port
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(('', 0))
    port = s.getsockname()[1]
    print "On port", port
    while True:
      s.listen(1)
      client, addr = s.accept()
      thread.start_new_thread(auth_socket, (client, addr))
    s.close()

thread.start_new_thread(run_sockets, ())
app.run(debug=True)

for s in bot_sockets:
    s.close()
