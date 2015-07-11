import os
import json
import logging
from glob import glob
from base64 import b64encode
from contextlib import contextmanager

ACTIVITIES = os.environ.get('ASLO_ACTIVITIES_ROOT')
ALL_BUNDLE_IDS = []
UPDATE_JSON = ''
FEATURED = {}
_INDEX = {}


@contextmanager
def cd(to):
    old = os.getcwd()
    os.chdir(to)
    yield
    os.chdir(old)


def pull_activities():
    '''
    Pull the git from GitHub and update our cache
    '''
    with cd(ACTIVITIES):
        os.system('git pull origin master')
    cache()


def cache():
    '''
    Cache up all the data needed to be cached up
    '''
    global _INDEX, FEATURED, ALL_BUNDLE_IDS, UPDATE_JSON
    index_cache = {}
    update_dict = {}

    for path in glob(os.path.join(ACTIVITIES, '*.json')):
        with open(path) as f:
            obj = json.load(f)

        if path.endswith('featured.json'):
            FEATURED = obj
        else:
            # Remove the .json
            bundle_id = os.path.basename(path)[:-5]
            if not ('title' in obj and 'categories' in obj and 'icon' in obj):
                continue
            small = dict(title=obj['title'],
                         categories=obj['categories'],
                         icon=obj['icon'])
            index_cache[bundle_id] = small

            u = {k: obj.get(k) for k in ('version', 'xo_url', 'xo_size')}
            u['minSugarVersion'] = \
                obj.get('min_sugar_version') or obj.get('minSugarVersion')
            update_dict[bundle_id] = u

    _INDEX = index_cache
    UPDATE_JSON = json.dumps(update_dict)
    ALL_BUNDLE_IDS = sorted(_INDEX.keys())

    for k, v in FEATURED.iteritems():
        item = FEATURED[k]
        activity = get_basic_activity(item['id'])
        if activity is not None:
            item['icon'] = activity.get('icon')
        else:
            logging.warning(
                'Featured entry included non-exsistant bundle %r', item['id'])


def get_activity(bundle_id):
    '''
    Get the json for an activity

    TODO: Cache
    '''
    path = os.path.join(ACTIVITIES, bundle_id + '.json')
    if os.path.isfile(path):
        with open(path) as f:
            return json.load(f)
    else:
        return None


def get_basic_activity(bundle_id):
    '''
    Get a limited version of the activity json including the title,
    categories and icon.
    '''
    return _INDEX.get(bundle_id)


def embed_icon(icon):
    '''
    Transform a svg icon into a base 64 data uri
    '''
    if icon is None:
        return ''
    return 'data:image/svg+xml;base64,' + b64encode(icon.encode('utf-8'))
