import os
import sys
from sys import argv
from glob import glob
from json import load, dump

activities = {}

for path in glob('data/*.json'):
    with open(path) as f:
        data = load(f)
    bundle_id = path.lstrip('data/').rstrip('.json')

    if bundle_id != 'featured':
        try:
            activities[bundle_id] = {
                'categories': data.get('categories'),
                'icon': data['icon'],
                'title': data['title']
            }
        except KeyError as e:
            # This activity must still be being processed
            continue

with open('data/featured.json') as f:
    featured = load(f)

with open(os.path.join(sys.argv[1], 'data.json'), 'w') as f:
    dump({'activities': activities, 'featured': featured}, f)
