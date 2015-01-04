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
