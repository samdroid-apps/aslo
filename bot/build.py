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
from ConfigParser import ConfigParser
from contextlib import contextmanager
from subprocess import call, check_output, CalledProcessError


def get_bundle_filename(bundle_id, metadata):
    '''
    Returns:
        * filename: str
        * new stable release: bool
    '''
    current = metadata.get('version')
    releases = metadata.get('releases', [])
    if releases:
        latest = releases[0]
        if latest.get('version') == current:
            # Just a random build
            name = '{}_{}.xo'.format(bundle_id, get_current_commit())
            return name, False
    return '{}_v{}.xo'.format(bundle_id, current), True


@contextmanager
def cd(to):
    old = os.getcwd()
    os.chdir(to)
    yield
    os.chdir(old)


def get_current_commit():
    with cd('dl'):
        try:
            return check_output(['git', 'rev-parse', 'HEAD']).strip()
        except CalledProcessError:
            return '?????'


def set_activity_metadata(bundle_id, clone_url):
    section = 'Activity'
    with open('dl/activity/activity.info') as f:
        cp = ConfigParser()
        cp.readfp(f)

    cp.set(section, 'git_hash', get_current_commit())

    if not cp.has_option(section, 'repository'):
        cp.set(section, 'repositroy', clone_url)

    cp.set(section, 'downloaded_via',
           'https://activities-2.sugarlabs.org/view/{}'.format(bundle_id))

    with open('dl/activity/activity.info', 'w') as f:
        cp.write(f)

def compile_bundle(bundle_id, clone_url):
    set_activity_metadata(bundle_id, clone_url)

    call(['rm', '-rf', 'dl/dist'])

    # Common issue
    if not os.path.isdir('dl/po'):
        os.mkdir('dl/po')

    abs_path = os.path.join(os.getcwd(), 'dl')
    call(['docker', 'run', 
          '-v', abs_path + ':/activity', 'samdroid/activity-build'])
    
    if os.path.isdir('dl/dist/') and len(os.listdir('dl/dist/')) == 1:
        path = os.path.join('dl/dist', os.listdir('dl/dist/')[0])
        with open(path, 'rb') as f:
            return f.read()
    return None
