import requests
import random
import json
from cairosvg import svg2png
from base64 import b64decode
import os
import os.path
from subprocess import call

API = 'http://socialhelp.sugarlabs.org'
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
        return

    name = activity['title'].get('en-US') or activity['title'].get('en_US')
    if not name:
        return

    if category_exists(name.lower().replace(' ', '-')):
        id = name.lower().replace(' ', '-')
        activity['socialhelp_category'] = id
        json.dump(activity, open(data_file, 'w'), indent=4, sort_keys=True)
        return 

    b64 = activity['icon'].strip('data:image/svg+xml;base64,')
    xml = b64decode(b64)
    logo = svg2png(bytestring=xml)

    create_category(name, logo)

    id = name.lower().replace(' ', '-')
    activity['socialhelp_category'] = id
    json.dump(activity, open(data_file, 'w'))

def main():
    # config = json.load(open('config.json'))
    API_KEY = os.environ['API_KEY']
    DATA_DIR = os.environ['DATA_DIR']

    for i in (os.path.join(DATA_DIR, f) for f in os.listdir(DATA_DIR)
              if os.path.isfile(os.path.join(DATA_DIR, f))):
        if i.endswith('.json') and 'featured.json' not in i:
            scan_activity(i)

    oldwd = os.getcwd()
    os.chdir(DATA_DIR)
    call(['git', 'commit', '-a', '-m',
          'Updated activity social help mappings'])
    call(['git', 'push'])
    os.chdir(oldwd)

if __name__ == '__main__':
    main()
