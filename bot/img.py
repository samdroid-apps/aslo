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

import re
import os
import uuid
import hashlib

import requests

BASE_URL = ('http://raw.githubusercontent.com'
            '/SAMdroid-apps/sugar-activities/master/')
# Don't steal this (for other apps)...
#         you can get as many as you like for FREE
AUTH = {'Authorization': 'Client-ID 7daeb235d4d80fc'}

def get_activity_data(bundle_id):
    r = requests.get(BASE_URL + bundle_id + '.json')
    if not r.ok:
        return {}
    else:
        return r.json()

def upload_image(img_name, current_hash):
    content = ''
    with open(img_name, 'rb') as f:
        h = hashlib.md5()
        content = f.read()
        h.update(content)
        hash_ = str(h.hexdigest())

    if hash_ in current_hash:
        return current_hash[hash_], hash_

    # Noooooo, we have to upload the image :(
    data = {'image': content.encode('base64'), 'type': 'base64'}
    r = requests.post('https://api.imgur.com/3/image', data=data, headers=AUTH)
    url = r.json()['data']['link']
    return url, hash_

def get_imgs(cp, bundle_id):
    results = {}
    activity = get_activity_data(bundle_id)
    if os.path.isdir('dl/screenshots'):
        results.update(upload_screenshots(activity))

    if not cp.has_option('Activity', 'icon'):
        return results

    icon_name = cp.get('Activity', 'icon')
    if not icon_name.endswith('.svg'):
        icon_name = icon_name + '.svg'

    if not os.path.isfile(os.path.join('dl/activity/', icon_name)):
        return results

    with open(os.path.join('dl/activity/', icon_name)) as f:
        icon = f.read()
    url = 'data:image/svg+xml;base64,' + icon.encode('base64')
    results.update({'icon': url})
    return results

def upload_screenshots(activity):
    EMPTY = {'screenshot': {}, 'screenshotHashes': {}}
    result = {'screenshots': {}, 'screenshotsHashes': {}}

    hashes = activity.get('screenshotsHashes', {})
    dirs = (i for i in os.listdir('dl/screenshots') if \
            os.path.isdir(os.path.join('dl/screenshots', i)))
    for dir_ in dirs:
        local_hashes = hashes.get(dir_, {})
        n_local_hashes = {}
        n_screenshots = []

        for file_name in os.listdir(os.path.join('dl/screenshots', dir_)):
            if not file_name.endswith('.png'):
                break
            file_path = os.path.join('dl/screenshots', dir_, file_name)
            url, hash_ = upload_image(file_path, local_hashes)
            n_local_hashes[hash_] = url
            n_screenshots.append(url)

        tag = dir_.replace('_', '-')
        result['screenshots'][tag] = n_screenshots
        result['screenshotsHashes'][tag] = n_local_hashes

    return result if result != EMPTY else {}
