# Copyright (C) Sam Parkinson 2015
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

from os import system, chdir
from flask import Flask


app = Flask(__name__)


@app.route('/pull', methods=['POST'])
def pull():
    system('git pull')
    chdir('/aslo/web/data')
    system('git pull')
    chdir('/aslo/web')

    system('bash build.sh --from-container')
    return 'Rebuilt, maybe'


if __name__ == '__main__':
    chdir('/aslo/web')
    app.run(host='0.0.0.0', debug=True)
