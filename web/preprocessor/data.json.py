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

import os
import re
import sys
from sys import argv
from glob import glob
from json import load, dump

root = sys.argv[1]
activities = {}

for path in glob(os.path.join(root, 'data/*.json')):
    with open(path) as f:
        data = load(f)

    match = re.search('data/(.+)\.json', path)
    if not match:
        continue
    bundle_id = match.group(1)

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

with open(os.path.join(root, 'data/featured.json')) as f:
    featured = load(f)

with open(os.path.join(root, 'data.json'), 'w') as f:
    dump({'activities': activities, 'featured': featured}, f)
