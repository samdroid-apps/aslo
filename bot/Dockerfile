FROM fedora

# Install Deps
RUN yum install -y git python-pip python-requests sugar-toolkit-gtk3 python-cairosvg
RUN pip install polib

# Install Bot
RUN mkdir /home/aslo
RUN git clone https://github.com/samdroid-apps/aslo /home/aslo

# Sugar lib (gtk2) dosn't seem to install properly
# So we add a link that makes it sugar3
RUN rm -rf /usr/lib/python2.7/site-packages/sugar
RUN ln -s /usr/lib/python2.7/site-packages/sugar3 /usr/lib/python2.7/site-packages/sugar

ENTRYPOINT ["python", "/home/aslo/bot/main.py"]
