import os
import re
import sys
from sys import argv
from glob import glob
from json import load, dump

activities = {}

for path in glob('data/*.json'):
    with open(path) as f:
        data = load(f)

    match = re.match('data/(.+)\.json', path)
    if not match:
        print path
        continue
    bundle_id = match.group(1)

    if bundle_id != 'featured':
        try:
            activities[bundle_id] = {
                'minSugarVersion': data.get('minSugarVersion'),
                'version': data.get('version'),
                'xo_url': data.get('xo_url'),
                'xo_size': data.get('xo_size')
            }
        except KeyError:
            # This activity must still be being processed
            continue

with open("data/featured.json") as f:
    featured = load(f)

with open(os.path.join(sys.argv[1], 'update.json'), 'w') as f:
    dump({'activities': activities}, f)
