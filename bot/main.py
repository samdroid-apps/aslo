import sys
import json
import socket
from subprocess import call

import requests

from test import test_activity
from build import compile_bundle

HOST = 'localhost'
PORT_HTTP = 5001
PORT = int(requests.get('http://' + HOST + ':' + str(PORT_HTTP) + '/port').text)

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect((HOST, PORT))

print "Connected to remote"

while True:
    task = s.recv(2048).strip().split('/')
    # TASK/task_id/bundle_id/gh_user/gh_repo

    print 'Got new task'
    call(['git', 'clone', 'https://www.github.com/%s/%s' % (task[3], task[4]),
          'dl'])
    result = test_activity(task[2], task[3] + '/' + task[4])

    data = {'result': result, 'file': compile_bundle(),
            'bundle_id': task[2], 'task_id': task[1]}

    headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}
    r = requests.post('http://' + HOST + ':' + str(PORT_HTTP) + '/done',
                      data=json.dumps(data), headers=headers)

    call(['rm', '-rf', 'dl'])

    print 'Mined 1 activity:', task[2]
