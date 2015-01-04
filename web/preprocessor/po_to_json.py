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
import glob
import json

regex = 'msgid "([^"]+)"\nmsgstr "([^"]+)"'

for name in glob.glob('translations/*.po'):
    with open(name) as f:
        text = f.read()

    d = {}
    for match in re.finditer(regex, text):
        d[match.group(1)] = match.group(2)

    with open(os.path.join(sys.argv[1],
                           name.replace('.po', '.json')), 'w') as f:
        json.dump(d, f)
