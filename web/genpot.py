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

import re
import glob
from datetime import datetime

import polib


def get_strings(regex, text):
    for match in re.finditer(regex, text):
        yield match.group(1)

strings = []

with open('index.html') as f:
    text = f.read()
with open('body.html') as f:
    text += f.read()

# HTML tags with i18n content
strings += list(get_strings(
               '<[^\n<>]+i18n-content[^\n<>]*>([^<>]+)</[a-zA-Z]+>', text))
# HTML tags with placeholders
strings += list(get_strings('placeholder="([^<>"]+)"', text))
# HTML tags with titles
strings += list(get_strings('title="([^<>"]+)"', text))

text = ''
for name in glob.glob('js/*.js'):
    if name == 'js/outp.js':
        continue

    with open(name) as f:
        text += f.read()

strings += list(get_strings("i18n\.get\('([^']+)'\)", text))
strings += list(get_strings('i18n\.get\("([^"]+)"\)', text))

po = polib.POFile()
po.metadata = {
    'Project-Id-Version': '1.0',
    'Report-Msgid-Bugs-To': 'sam@sugarlabs.org',
    'POT-Creation-Date': datetime.utcnow().strftime('%Y-%m-%d %H:%M+0000'),
    'PO-Revision-Date': datetime.utcnow().strftime('%Y-%m-%d %H:%M+0000'),
    'MIME-Version': '1.0',
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Transfer-Encoding': '8bit',
}

for s in set(strings):
    entry = polib.POEntry(msgid=s, msgstr='')
    po.append(entry)

po.save('translations/ASLO.pot')
