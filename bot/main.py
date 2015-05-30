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
import pprint
import socket
from subprocess import call

import requests
import fedmsg
fedmsg.init(name='test' if os.environ.get('ASLO_DEBUG') else 'prod')

from props import get_activity_data
from build import compile_bundle, get_bundle_filename


DL_ROOT = 'https://download.sugarlabs.org/activities2'


print 'Waiting for 1st task'
for name, endpoint, topic, msg in fedmsg.tail_messages():
    if topic != 'org.sugarlabs.prod.hookin.hookS' or \
       msg['msg'].get('bundle_id') is None:
        continue

    clone_url = msg['msg']['clone_url']
    bundle_id = msg['msg']['bundle_id']

    print 'Now mining: {} ({})'.format(bundle_id, clone_url)
    call(['rm', '-rf', 'dl'])
    call(['git', 'clone', clone_url, 'dl'])

    result = get_activity_data(bundle_id)
    filename, new_release = get_bundle_filename(bundle_id, result)

    bundle = compile_bundle(bundle_id, clone_url)
    if not bundle:
        print 'Failed to build bundle'
        print 'Assuming buggy code, skipping'
        continue

    # TODO: Replace github_url with clone_homepage
    result['github_url'] = clone_url.lstrip('https://github.com/')
    v_name = '' if new_release else '_latest'
    result['xo_url' + v_name] = '{}/{}'.format(DL_ROOT, filename)
    result['xo{}_timestamp'.format(v_name)] = time.time()
    result['xo{}_size'.format(v_name)] = len(bundle)

    if new_release or result.get('releases') is None:
        if result.get('releases') is None:
            result['releases'] = []

        new_version = {'xo_url': result['xo_url'],
                       'version': result['version'],
                       'min_sugar_version': result.get('min_sugar_version'),
                       'whats_new': result.get('whats_new', {}),
                       'screenshots': result.get('screenshots', {})}
        result['releases'].insert(0, new_version)

    data = {'result': result,
            'bundle_id': bundle_id,
            'bundle_filename': filename,
            'bundle': bundle}
    fedmsg.publish(topic='result', modname='aslo-bot', msg=msg)

    print 'Mined activity:', bundle_id
