import re
import os
import uuid
import hashlib

import requests
import cairosvg

DATA_JSON = 'https://raw.githubusercontent.com/SAMdroid-apps/sugar-activities/master/data.json'
ICON_RE = re.compile('icon\s*=\s*(.*)')
WIDTH
# Don't steal this (for other apps)...
#         you can get as many as you like for FREE
AUTH = {'Authorization': 'Client-ID 7daeb235d4d80fc'}

def get_activity_data(bundle_id):
    r = requests.get(DATA_JSON)
    d = r.json()
    return d['activities'][bundle_id]

def get_imgs(activity_info, bundle_id):
    activity = get_activity_data(bundle_id)

    icon_name = ICON_RE.search(activity_info).group(1)
    if not icon_name.endswith('.svg'):
        icon_name = icon_name + '.svg'

    if not os.path.isfile(os.path.join('dl/activity/', icon_name)):
        return {}

    content = ''
    with open(os.path.join('dl/activity/', icon_name), 'rb') as f:
        h = hashlib.md5()
        content = f.read()
        h.update(content)
        hash_ = str(h.hexdigest())

    if hash_ == activity.get('iconHash') or content == '':
        return {}

    # Noooooo, we have to upload the image :(
    png = cairosvg.svg2png(bytestring=content)

    data = {'image': png.encode('base64'), 'type': 'base64'}
    r = requests.post('https://api.imgur.com/3/image', data=data, headers=AUTH)
    url = r.json()['data']['link']
    return {'icon': url, 'iconHash': hash_}
