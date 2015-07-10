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
import json
from threading import Lock
from subprocess import call
from base64 import b64decode
from contextlib import contextmanager

from pykafka import KafkaClient


git_lock = Lock()
BUNDLES = os.environ.get('ASLO_BUNDLES_ROOT')
ACTIVITIES = os.environ.get('ASLO_ACTIVITIES_ROOT')


@contextmanager
def cd(to):
    old = os.getcwd()
    os.chdir(to)
    yield
    os.chdir(old)


def pull():
    with git_lock:
        with cd(ACTIVITIES):
            call(['git', 'pull', 'origin', 'master'])


def save(data):
    result = data['result']
    bundle_id = data['bundle_id']
    commit_message = data['commit_message']
    print 'Saving new data for {}: "{}"'.format(bundle_id, commit_message)

    filename = data.get('bundle_filename')
    if filename:
        data = b64decode(data['bundle'])
        with open(os.path.join(BUNDLES, filename), 'wb') as f:
            f.write(data)

    pull()
    with git_lock:
        with cd(ACTIVITIES):
            if os.path.isfile(bundle_id + '.json'):
                current = json.load(open(bundle_id + '.json'))
            else:
                current = {}
            current.update(result)
            with open(bundle_id + '.json', 'w') as f:
                json.dump(current, f, indent=4, sort_keys=True)

            call(['git', 'add', bundle_id + '.json'])
            call(['git', 'commit', '-m', commit_message])
            # call(['git', 'push', 'origin', 'master'])


if __name__ == '__main__':
    client = KafkaClient(hosts='freedom.sugarlabs.org:9092')
    topic = client.topics['org.sugarlabs.aslo-changes']
    consumer = topic.get_balanced_consumer(
        consumer_group='aslo-bot-master',
        auto_commit_enable=True,
        zookeeper_connect='freedom.sugarlabs.org:2181',
        fetch_message_max_bytes=50000000)

    while True:
        msg = consumer.consume()
        try:
            data = json.loads(msg.value)
        except ValueError:
            print 'Invalid json in message', msg.offset, msg.value
            continue
        try:
            save(data)
        except Exception as e:
            print 'Error processing {}: {}'.format(msg.offset, e)
