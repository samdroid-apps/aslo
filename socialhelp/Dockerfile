FROM debian

RUN apt-get update
RUN apt-get install git python-flask python-cairosvg python-pip -y --fix-missing
RUN pip install requests

RUN git clone http://github.com/samdroid-apps/aslo /aslo
RUN git clone http://github.com/samdroid-apps/sugar-activities /activities

ENV DATA_DIR /activities
EXPOSE 8000

CMD cd aslo/socialhelp; python shfr.py
