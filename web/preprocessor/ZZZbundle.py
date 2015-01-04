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
import sys

script, root = sys.argv
files = []

for name in ['main.js', 'index.css', 'body.html', 'data.json']:
    with open(os.path.join(root, name)) as f:
        files.append(f.read().strip())

lens = ['{0:07d}'.format(len(f)) for f in files]

with open(os.path.join(root, 'bundle'), 'w') as f:
    f.write(''.join(lens + files))
