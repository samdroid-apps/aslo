import re
import os

import requests

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
        return resp.json()[0]['name']
    return None

VERSION_REGEX = re.compile('activity_version\s*=\s*([0-9.]*)')
def get_activity_version(text):
    r = VERSION_REGEX.search(text)
    if r:
        try:
            return float(r.group(1))
        except ValueError:
            return None
    return None

def test_activity(bundle_id, gh):
    results = {}
    with open('dl/activity/activity.info') as f:
        text = f.read()
        results['isWeb'] = is_web(text)

        v = get_activity_version(text)
        if v: results['version'] = v

    results['isGTK3'] = is_gtk3('dl/', bundle_id)
    results['hasOldToolbars'] = has_old_toolbars('dl/', bundle_id)

    latest = get_latest_version(gh)
    if latest: results['github_current_tag'] = latest
    return results

if __name__ == '__main__':
  print test_activity(raw_input('Bundle ID: '))