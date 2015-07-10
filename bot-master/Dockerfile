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

RUN git config --global user.name "aslo-bot"; \
    git config --global user.email "sam.parkinson3+aslobots@gmail.com"

RUN git clone https://github.com/SAMdroid-apps/sugar-activities /activities; \
    cd /activities; \
    git remote rm origin; \
    git remote add origin git@github.com:SAMdroid-apps/sugar-activities.git
ENV ASLO_ACTIVITIES_ROOT /activities

RUN mkdir /bundles
VOLUME /bundles
ENV ASLO_BUNDLES_ROOT /bundles

RUN rm -rf /root/.ssh; \
    mkdir /root/.ssh
VOLUME /root/.ssh

ADD . /aslo/botmaster
RUN pip install -r /aslo/botmaster/requirements.txt

USER root
CMD python /aslo/botmaster/main.py
