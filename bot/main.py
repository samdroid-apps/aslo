import os
import json
import time
import socket
from subprocess import call

import requests

from test import test_activity
from build import compile_bundle

# Fixes a weird bug... it might create some though :P
os.environ['http_proxy'] = ''

# HOST = 'http://localhost:5001'
HOST = 'http://aslo-bot-master.sugarlabs.org'

print 'Waiting for 1st task'

while True:
    r = requests.get(HOST + '/task')
    if r.status_code == 404:
        time.sleep(7)
        continue
    task = r.json()

    print 'Got new task'
    call(['git', 'clone', 'https://www.github.com/' + task['gh'],
          'dl'])
    result = test_activity(task['bundle_id'], task['gh'])

    data = {'result': result, 'file': compile_bundle(),
            'bundle_id': task['bundle_id'], 'task_id': task['task_id']}

    headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}
    r = requests.post(HOST + '/done',
                      data=json.dumps(data), headers=headers)

    call(['rm', '-rf', 'dl'])

    print 'Mined 1 activity:', task['bundle_id'], task['gh']
