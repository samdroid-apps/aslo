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
import sys
from pprint import pprint
from ConfigParser import ConfigParser

import requests

from po_crawl import get_translation_for_field
import img

def is_web(cp):
    if cp.has_option('Activity', 'exec'):
      return cp.get('Activity', 'exec') == 'sugar-activity-web'
    return False  # Fallback


GTK3_IMPORT_TYPES = {'sugar3': 3, 'from gi.repository import Gtk': 3,
                     'sugar.': 2, 'import pygtk': 2, 'pygtk.require': 2}
def is_gtk3(bundle_path, bundle_id):
    setup_py_path = os.path.join(bundle_path, 'setup.py')
    main_filename = '/'.join(bundle_id.split('.')[-1]) + '.py'
    main_file_path = os.path.join(bundle_path, main_filename)
    all_files = os.listdir(bundle_path)
    try_paths = [setup_py_path, main_file_path] + all_files

    for path in try_paths:
        if os.path.isfile(path):
            with open(path) as f:
                text = f.read()
                for sign in GTK3_IMPORT_TYPES:
                    if sign in text:
                        version = GTK3_IMPORT_TYPES[sign]
                        return version == 3

    # Fallback to assuming GTK3
    return True

OLD_TOOLBAR_SIGNS = ['activity.ActivityToolbox', 'gtk.Toolbar']
def has_old_toolbars(bundle_path, bundle_id):
    main_filename = '/'.join(bundle_id.split('.')[-1]) + '.py'
    main_file_path = os.path.join(bundle_path, main_filename)
    all_files = os.listdir(bundle_path)
    try_paths = [main_file_path] + all_files

    for path in try_paths:
        if os.path.isfile(path):
            with open(path) as f:
                text = f.read()
                for sign in OLD_TOOLBAR_SIGNS:
                    if sign in text:
                        return True
    return False


def get_latest_version(gh):
    resp = requests.get('https://api.github.com/repos/%s/tags' % gh)
    if resp.ok:
        if len(resp.json()):
            return resp.json()[0]['name']
    return None

def get_activity_version(cp):
    if not cp.has_option('Activity', 'activity_version'):
        return None

    v = cp.get('Activity', 'activity_version')
    try:
        return int(v)
    except ValueError:
        try:
            return float(v)
        except ValueError:
            return None

def get_categories(cp):
    if not cp.has_option('Activity', 'categories'):
        if not cp.has_option('Activity', 'category'):
            return None

        c = cp.get('Activity', 'category')
    else:
        c = cp.get('Activity', 'categories')
    return c.strip().split(' ')

def get_news_file(path):
    with open(path) as f:
        r = ''
        started = False
        for line in f:
            line = line.strip()
            if line.isdigit() and not started:
                started = True
            elif line.isdigit():
                return r.strip('<br/>')
            elif line != '':
                r = r + '<br/>' + line
            else:
                pass

def get_news():
    r = {}
    if os.path.isfile('dl/NEWS'):
        r['en-US'] = get_news_file('dl/NEWS')

    for lang in [i.split('.')[1] for i in os.listdir('dl') \
                       if i.startswith('NEWS.')]:
        r[lang] = get_news_file('dl/NEWS.' + lang)
    return r

def test_activity(bundle_id, gh):
    results = {}
    results['github_url'] = gh

    with open('dl/activity/activity.info') as f:
        cp = ConfigParser()
        cp.readfp(f)

        v = get_activity_version(cp)
        if v: results['version'] = v

        c = get_categories(cp)
        if c: results['categories'] = c

        t = get_translation_for_field(cp, 'name')
        if t: results['title'] = t

        t = get_translation_for_field(cp, 'summary')
        if t: results['description'] = t

        results['isWeb'] = is_web(cp)

        results.update(img.get_imgs(cp, bundle_id))

    results['isGTK3'] = is_gtk3('dl/', bundle_id)
    results['hasOldToolbars'] = has_old_toolbars('dl/', bundle_id)

    results['whats_new'] = get_news()

    min_ = "0.100" if results['isWeb'] else (
               "0.96" if results['isGTK3'] else (
                   "0.86" if not results['hasOldToolbars'] else "0.82"
            ))
    results['minSugarVersion'] = min_
                   

    latest = get_latest_version(gh)
    if latest: results['github_current_tag'] = latest
    return results

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print "Usage:\n\tpython test.py <bundle id> <github user/repo>"
    else:
        pprint(test_activity(sys.argv[1], sys.argv[2]))
