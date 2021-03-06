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

import requests
import random
import json
from cairosvg import svg2png
from base64 import b64decode
import os
import os.path
from subprocess import call

API = 'https://socialhelp.sugarlabs.org'
API_USER = 'system'
API_KEY = ''
DATA_DIR = '.'

DEFAULT_DESC = ('This is the home of the {} Activity. '
                'Get help, discuss features or anything '
                'else related to this activity.')
COLORS = ['006E00', '78E600', '033CD2', '00BEFF', '6E008C',
          'FF64D2', 'A00000', 'FF7800', 'FFD732', '999999']

def category_exists(name):
    r = requests.get('{}/c/{}'.format(API, name))
    return r.status_code == 200

def create_category(name, logo_bytes):
    r = requests.post('{}/category/uploads'.format(API),
                       files={'files[]': ('icon.png', logo_bytes, 'image/png'),
                              'image_type': ('image_type', 'logo')},
                       data={'api_key': API_KEY, 'api_username': API_USER})
    logo_url = r.json()['url']

    color = random.choice(COLORS)
    r = requests.post('{}/categories'.format(API), data={
        'api_key': API_KEY,
        'api_username': API_USER,
        'name': name,
        'logo_url': logo_url,
        'color': random.choice(COLORS),
        'text_color': 'FFFFFF',
        'permissions[everyone]': '1',
        'allow_badges': 'true'})

    topic = r.json()['category']['topic_url']
    r = requests.get('{}{}.json'.format(API, topic))

    post = r.json()['post_stream']['posts'][0]['id']
    r = requests.put('{}/posts/{}'.format(API, post), data={
        'api_key': API_KEY,
        'api_username': API_USER,
        'post[raw]': DEFAULT_DESC.format(name),
        'post[edit_reason]': ''
    })

    r = requests.put('{}{}/status'.format(API, topic),  data={
        'api_key': API_KEY,
        'api_username': API_USER,
        'status': 'closed',
        'enabled': 'true'
    })


def scan_activity(data_file):
    activity = json.load(open(data_file))

    if activity.get('socialhelp_category'):
        json.dump(activity, open(data_file, 'w'), indent=4, sort_keys=True)
        return False

    if activity.get('title') is None:
        # This activity needs to be built!
        return False

    name = activity['title'].get('en-US') or activity['title'].get('en_US')
    if not name:
        return False

    if category_exists(name.lower().replace(' ', '-')):
        id = name.lower().replace(' ', '-')
        activity['socialhelp_category'] = id
        json.dump(activity, open(data_file, 'w'), indent=4, sort_keys=True)
        return 

    icon = activity.get('icon')
    if icon is None:
        return False

    try:
        logo = svg2png(bytestring=xml)
    except Exception as e:
        print 'Error with activity', name, 'is', e
        return False

    create_category(name, logo)

    id = name.lower().replace(' ', '-')
    activity['socialhelp_category'] = id
    json.dump(activity, open(data_file, 'w'))
    return True


def main():
    API_KEY = os.environ['API_KEY']
    DATA_DIR = os.environ['DATA_DIR']

    commit = False
    for i in (os.path.join(DATA_DIR, f) for f in os.listdir(DATA_DIR)
              if os.path.isfile(os.path.join(DATA_DIR, f))):
        if i.endswith('.json') and 'featured.json' not in i:
            if scan_activity(i):
                commit = True

    if commit:
        oldwd = os.getcwd()
        os.chdir(DATA_DIR)
        call(['git', 'commit', '-a', '-m',
              'Updated activity social help mappings'])
        call(['git', 'push', 'origin', 'master'])
        os.chdir(oldwd)


if __name__ == '__main__':
    main()
