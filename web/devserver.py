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

from flask import Flask, send_file
import os

app = Flask(__name__)

def send_file_simple(path):
    with open(path) as f:
        return f.read()

@app.route('/')
@app.route('/view/<path>')
def static_index(path=''):
    return send_file('index.html')

@app.route('/bundle')
def bundle():
    os.system('bash build.sh --quick')
    return send_file_simple('bundle')

@app.route('/<path:path>')
def static_file(path):
    return send_file(path)

if __name__ == "__main__":
    app.run()
    os.system('rm bundle index.css.map index.css main.js update.json data.json')
