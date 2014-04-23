import re
import os
import uuid
import hashlib

import requests
import cairosvg

# FIXME: this lags behind commits
DATA_JSON = 'https://raw.githubusercontent.com/SAMdroid-apps/sugar-activities/master/data.json'
ICON_RE = re.compile('icon\s*=\s*(.*)')
# Don't steal this (for other apps)...
#         you can get as many as you like for FREE
AUTH = {'Authorization': 'Client-ID 7daeb235d4d80fc'}

def get_activity_data(bundle_id):
    r = requests.get(DATA_JSON)
    d = r.json()
    return d['activities'][bundle_id]

def upload_image(img_name, current_hash, svg=False):
    content = ''
    with open(img_name, 'rb') as f:
        h = hashlib.md5()
        content = f.read()
        h.update(content)
        hash_ = str(h.hexdigest())

    if hash_ in current_hash or content == '':
        return {}

    # Noooooo, we have to upload the image :(
    if svg:
        content = cairosvg.svg2png(bytestring=content)

    data = {'image': content.encode('base64'), 'type': 'base64'}
    r = requests.post('https://api.imgur.com/3/image', data=data, headers=AUTH)
    url = r.json()['data']['link']
    return url, hash_

def get_imgs(activity_info, bundle_id):
    results = {}
    activity = get_activity_data(bundle_id)

    if os.path.isdir('dl/screenshots'):
        results.update(upload_screenshots(activity))

    icon_name = ICON_RE.search(activity_info).group(1)
    if not icon_name.endswith('.svg'):
        icon_name = icon_name + '.svg'

    if not os.path.isfile(os.path.join('dl/activity/', icon_name)):
        return results

    url, hash_ = upload_image(os.path.join('dl/activity/', icon_name),
                              [activity.get('iconHash')], svg=True)
    results.update({'icon': url, 'iconHash': hash_})
    return results

def upload_screenshots(activity):
    EMPTY = {'screenshot': {}, 'screenshotHashes': {}}
    result = {'screenshots': {}, 'screenshotsHashes': {}}

    hashes = activity.get('screenshotsHashes', {})
    dirs = (i for i in os.listdir('dl/screenshots') if \
            os.path.isdir(os.path.join('dl/screenshots', i)))
    for dir_ in dirs:
        local_hashes = hashes.get(dir_, [])
        n_local_hashes = []
        n_screenshots = []

        for file_name in os.listdir(os.path.join('dl/screenshots', dir_)):
            if not file_name.endswith('.png'):
                break
            file_path = os.path.join('dl/screenshots', dir_, file_name)
            url, hash_ = upload_image(file_path, local_hashes)
            n_local_hashes.append(hash_)
            n_screenshots.append(url)

        result['screenshots'][dir_] = n_screenshots
        result['screenshotsHashes'][dir_] = n_local_hashes

    return result if result != EMPTY else {}
