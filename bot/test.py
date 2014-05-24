import re
import os

import requests

from po_crawl import get_translation_from_regex
import img

IS_WEB_RE = re.compile('exec\s*=\s*sugar-activity-web')
def is_web(text):
    return bool(IS_WEB_RE.search(text))


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

VERSION_REGEX = re.compile('activity_version\s*=\s*([0-9.]*)')
def get_activity_version(text):
    r = VERSION_REGEX.search(text)
    if r:
        try:
            return int(r.group(1))
        except ValueError:
            try:
                return float(r.group(1))
            except ValueError:
                return None
    return None

SUMMARY_REGEX = re.compile('summary\s*=\s*(.*)')
NAME_REGEX = re.compile('name\s*=\s*(.*)')

def get_news_file(path):
    with open(path) as f:
        r = ''
        started = False
        for line in f:
            line = line.strip()
            if line.isdigit() and not started:
                started = True
            elif line.isdigit():
                return r
            elif line != '':
                r = r + '<br/>' + line
            else:
                pass

def get_news():
    r = {}
    if os.path.isfile('dl/NEWS'):
        r['en_US'] = get_news_file('dl/NEWS')

    for lang in [i.split('.')[1] for i in os.listdir('dl') \
                       if i.startswith('NEWS.')]:
        r[lang] = get_news_file('dl/NEWS.' + lang)
    return r

def test_activity(bundle_id, gh):
    results = {}
    results['github_url'] = gh

    with open('dl/activity/activity.info') as f:
        text = f.read()

        v = get_activity_version(text)
        if v: results['version'] = v

        t = get_translation_from_regex(NAME_REGEX, text)
        if t: results['title'] = t

        t = get_translation_from_regex(SUMMARY_REGEX, text)
        if t: results['description'] = t

        results['isWeb'] = is_web(text)

        results.update(img.get_imgs(text, bundle_id))

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
    print test_activity(raw_input('Bundle ID: '), raw_input('GitHub: '))
