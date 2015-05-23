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

FROM python:2.7

RUN git clone https://github.com/samdroid-apps/sugar-activities /activities
ENV ASLO_ACTIVITIES_ROOT /activities
RUN apt-get update; \
    apt-get install python-fedmsg -y

ADD . /aslo/hookin
RUN pip install -r /aslo/hookin/requirements.txt

EXPOSE 5000
CMD python /aslo/hookin/main.py
