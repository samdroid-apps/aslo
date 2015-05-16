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

FROM fedora:21

# Install dependancies
RUN yum install -y git

RUN git clone --depth=1 https://github.com/sugarlabs/sugar-toolkit-gtk3; \
    mv sugar-toolkit-gtk3/src/sugar3 /usr/lib/python2.7/site-packages/sugar3; \
    rm -rf sugar-toolkit-gtk3

# Sugar lib (gtk2) dosn't seem to install properly
# So we add a link that makes it sugar3
RUN rm -rf /usr/lib/python2.7/site-packages/sugar; \
    ln -s /usr/lib/python2.7/site-packages/sugar3 /usr/lib/python2.7/site-packages/sugar

RUN mkdir /activity
VOLUME /activity

WORKDIR /activity
ENTRYPOINT ["sh", "-c", "python setup.py dist_xo --no-fail; chmod 777 /activity/*; rm -rf /activity/locale"]
