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

FROM fedora

# Install Deps
RUN yum install -y git python-pip python-requests sugar-toolkit-gtk3
RUN pip install polib

# Install Bot
RUN mkdir /home/aslo
RUN git clone https://github.com/samdroid-apps/aslo /home/aslo

# Sugar lib (gtk2) dosn't seem to install properly
# So we add a link that makes it sugar3
RUN rm -rf /usr/lib/python2.7/site-packages/sugar
RUN ln -s /usr/lib/python2.7/site-packages/sugar3 /usr/lib/python2.7/site-packages/sugar

ENTRYPOINT ["python", "/home/aslo/bot/main.py"]
