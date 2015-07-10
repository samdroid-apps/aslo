# Copyright (C) Sam Parkinson 2015
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
from base64 import b64encode

import requests
from pykafka import KafkaClient

from img import get_current_activity_data
from props import get_activity_data
from build import compile_bundle, get_bundle_filename


client = KafkaClient(hosts='freedom.sugarlabs.org:9092')
consumer = client.topics['org.sugarlabs.hook'].get_balanced_consumer(
    consumer_group='aslo-bot-union',
    auto_commit_enable=True,
    zookeeper_connect='freedom.sugarlabs.org:2181')
producer = client.topics['org.sugarlabs.aslo-changes'].get_producer()

DL_ROOT = 'https://download.sugarlabs.org/activities2'


print 'Waiting for 1st task'
# FIXME:  Don't consume all messages since the begining of time, only
#         messages sent after we start running
while True:
    msg = consumer.consume()
    try:
        value = json.loads(msg.value)
    except ValueError:
        print 'Invalid json in message', msg.offset, msg.value
        continue
    if value.get('bundle_id') is None:
        print 'No bundle id in message', value
        continue

    clone_url = value['clone_url']
    bundle_id = value['bundle_id']

    print 'Now mining: {} ({})'.format(bundle_id, clone_url)
    call(['rm', '-rf', 'dl'])
    call(['git', 'clone', clone_url, 'dl'])

    result = get_current_activity_data(bundle_id)
    result.update(get_activity_data(bundle_id))
    filename, new_release = get_bundle_filename(bundle_id, result)

    bundle = compile_bundle(bundle_id, clone_url)
    if not bundle:
        print 'Failed to build bundle'
        print 'Assuming buggy code, skipping'
        continue

    result['clone_homepage'] = clone_url
    result['github_url'] = clone_url.lstrip('https://github.com/')
    commit_message = 'Rebuild development copy of {}'.format(bundle_id)

    version_name = '' if new_release else '_latest'
    result['xo_url' + version_name] = '{}/{}'.format(DL_ROOT, filename)
    result['xo{}_timestamp'.format(version_name)] = time.time()
    result['xo{}_size'.format(version_name)] = len(bundle)

    if new_release or result.get('releases') is None:
        if result.get('releases') is None:
            result['releases'] = []

        new_version = {'xo_url': result['xo_url'],
                       'version': result['version'],
                       'min_sugar_version': result.get('min_sugar_version'),
                       'whats_new': result.get('whats_new', {}),
                       'screenshots': result.get('screenshots', {})}
        result['releases'].insert(0, new_version)
        commit_message = 'Release {} version {}\n\n{}'.format(
            bundle_id, result['version'], result.get('whats_new', {}) \
                .get('en-US', '').replace('<br/>', '\n'))
        commit_message = commit_message.strip()

    data = {'result': result,
            'bundle_id': bundle_id,
            'bundle_filename': filename,
            'bundle': b64encode(bundle),
            'commit_message': commit_message}
    producer.produce([json.dumps(data)])

    print 'Mined activity:', bundle_id
