FROM fedora

# Install Deps
RUN yum install -y sugar-toolkit-gtk3
RUN yum install -y patch git

# Patch to add the --no-fail option
WORKDIR /tmp
RUN curl -O https://github.com/sugarlabs/sugar-toolkit-gtk3/pull/169.patch
RUN patch /usr/lib/python2.7/site-packages/sugar3/activity/bundlebuilder.py < 169.patch

# Sugar lib (gtk2) dosn't seem to install properly
# So we add a link that makes it sugar3
RUN rm -rf /usr/lib/python2.7/site-packages/sugar
RUN ln -s /usr/lib/python2.7/site-packages/sugar3 /usr/lib/python2.7/site-packages/sugar

RUN mkdir /activity
VOLUME /activity

WORKDIR /activity
ENTRYPOINT ["python", "setup.py", "dist_xo", "--no-fail"]
