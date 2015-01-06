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
import sys
import json
import time
import socket
from subprocess import call

import requests

from test import test_activity
from build import compile_bundle

# Fixes a weird bug... it might create some though :P
os.environ['http_proxy'] = ''

HOST = 'http://localhost:5001'
#  HOST = 'http://aslo-bot-master.sugarlabs.org'
XO_MIME = 'application/vnd.olpc-sugar'

print 'Waiting for 1st task'
while True:
    try:
        r = requests.get(HOST + '/task')
    except requests.exceptions.ConnectionError, e:
        continue
    if r.status_code == 404:
        time.sleep(7)
        continue
    task = r.json()

    print 'Now mining: {} ({})'.format(task['bundle_id'], task['gh'])
    call(['git', 'clone', 'https://www.github.com/' + task['gh'],
          'dl'])
    try:
        result = test_activity(task['bundle_id'], task['gh'])
    except Exception as e:
        print 'Failed processing bundle'
        print e
        sys.exit(1)

    data = {'result': result,
            'bundle_id': task['bundle_id'],
            'task_id': task['task_id']}
    files = {'json': ('result.json', json.dumps(data))}
    bundle = compile_bundle()
    if not bundle:
        print 'Failed to build bundle'
        print 'Assuming buggy code, skipping'
        continue
    files['bundle'] = ('bundle.xo', bundle, XO_MIME)

    try_ = 0
    while True:
        try:
            try_ += 1
            r = requests.post(HOST + '/done2', files=files)
            print r.status_code, r.text
            break
        except Exception as e:
            if try_ == 10:
                print 'Failed to upload result after 10 trys'
                print e
                sys.exit(2)

    bundle.close()
    call(['rm', '-rf', 'dl'])

    print 'Mined 1 activity:', task['bundle_id'], task['gh']
