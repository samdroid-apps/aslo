FROM fedora

# Install Deps
RUN yum install -y git python-pip python-requests sugar-toolkit-gtk3 python-cairosvg
RUN pip install polib

# Install Bot
RUN mkdir /home/aslo
RUN git clone https://github.com/samdroid-apps/aslo /home/aslo

ENTRYPOINT ["python", "/home/aslo/bot/main.py"]
