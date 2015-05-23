import re
import os
import json
import requests
from contextlib import contextmanager

import fedmsg
fedmsg.init(name='test' if os.environ.get('ASLO_DEBUG') else 'prod')


ACTIVITIES = os.environ.get('ASLO_ACTIVITIES_ROOT')
ACTIVITIES_GITHUB = 'samdroid-apps/sugar-activities'

_INVALID_BUNDLE_ERROR = ('Warning: the bundle id found in the activity.info'
                         ' file was not in the New ASLO or the repository was'
                         ' unexpected for this bundle id.')


def _bundle_id_for_repo(url):
    '''
    Args:
        * url:  github url in the format "abc/abc"

    Returns
        None if the repo is not an activity
        The activity's bundle id if it is an activity
    '''
    r = requests.get('https://raw.githubusercontent.com/{}/master/activity'
                     '/activity.info'.format(url))
    if r.ok:
        match = re.search('bundle_id\s+=\s+(.*)', r.text)
        if match:
            bundle_id = match.group(1).strip()
            return bundle_id
        else:
            return None
    return None


def _verify_repo_for_bundle_id(url, id):
    '''
    Check that the repo is the correct one for the bundle id

    Args:
        * url:  github url in the format "abc/abc"
        * id:  bundle id string

    Returns:  bool
    '''
    path = os.path.join(ACTIVITIES, '{}.json'.format(id))
    if not os.path.isfile(path):
        return False

    with open(path) as f:
        try:
            j = json.load(f)
        except ValueError:
            return False

        if not 'github_url' in j:
            return True
        return j['github_url'] == url
    return False


@contextmanager
def cd(to):
    old = os.getcwd()
    os.chdir(to)
    yield
    os.chdir(old)


def handle_specials(url):
    if url == ACTIVITIES_GITHUB:
        with cd(ACTIVITIES):
            os.system('git pull origin master')


def hook_call_to_bus(url):
    '''
    Publish the hook call to the sugar bus

    Args:
        * url:  github url in the format "abc/abc"
    '''
    msg = {'clone_url': 'https://github.com/{}'.format(url)}
    bundle_id = _bundle_id_for_repo(url)
    if bundle_id and _verify_repo_for_bundle_id(url, bundle_id):
        msg['bundle_id'] = bundle_id
    elif bundle_id:
        msg['info'] = _INVALID_BUNDLE_ERROR
    fedmsg.publish(topic='hookS', modname='hookin', msg=msg)
