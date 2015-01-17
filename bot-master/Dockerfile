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

FROM debian

RUN apt-get update
RUN apt-get install git python-flask python-pip -y --fix-missing
RUN pip install requests

RUN git config --global user.name "ASLO Bots Uninted"
RUN git config --global user.email "sam.parkinson3+aslobots@gmail.com"
RUN git clone http://github.com/samdroid-apps/aslo /aslo

RUN git clone https://github.com/SAMdroid-apps/sugar-activities /aslo/bot-master/git
WORKDIR /aslo/bot-master/git
RUN git remote rm origin
RUN git remote add origin git@github.com:SAMdroid-apps/sugar-activities.git
RUN echo "github.com,192.30.252.131 ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEAq2A7hRGmdnm9tUDbO9IDSwBK6TbQa+PXYPCPy6rbTrTtw7PHkccKrpp0yVhp5HdEIcKr6pLlVDBfOLX9QUsyCOV0wzfjIJNlGEYsdlLJizHhbn2mUjvSAHQqZETYP81eFzLQNnPHt4EVVUh7VfDESU84KezmD5QlWpXLmvU31/yMf+Se8xhHTvKSCZIFImWwoG6mbUoWf9nzpIoaSjB+weqqUUmpaaasXVal72J+UX2B+2RPW3RcT0eOzQgqlJL3RKrTJvdsjE3JEAvGq3lGHSZXy28G3skua2SmVi/w4yCE6gbODqnTWlg7+wC604ydGXA8VJiS5ap43JXiUFFAaQ==" > ~/.ssh/known_hosts
WORKDIR /

RUN mkdir /aslo/bot-master/out
VOLUME /aslo/bot-master/out

RUN rm -rf /root/.ssh
RUN mkdir /root/.ssh
VOLUME /root/.ssh

EXPOSE 5001

USER root
WORKDIR /aslo/bot-master
CMD python main.py
