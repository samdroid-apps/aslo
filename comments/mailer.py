import os
import uuid
import smtplib
import getpass
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import rethinkdb as r

conn = r.connect('localhost', 28015)
emails = r.db('comments').table('emails')

if os.path.isfile('email.password'):
    with open('email.password') as f:
        i = f.read().strip().split('|')
        EMAIL_UNAME = i[0]
        EMAIL_PW = i[1]
else:
    EMAIL_UNAME = raw_input('SLO email username (eg. sam): ')
    EMAIL_PW = getpass.getpass('Password: ')
    with open('email.password', 'w') as f:
        f.write(EMAIL_UNAME + '|' + EMAIL_PW)
    print 'Email config now kept in email.password'

MY_EMAIL = EMAIL_UNAME + '@sugarlabs.org'
MODERATORS = ['sam.parkinson3@gmail.com']

TEXT_TEMPLATE = """
A comment by %s was flagged. It was:
--------
%s
--------
Go to %s to keep it and %s to kill it"""
HTML_TEMPLATE = """
<p>A comment by <kbd>%s</kbd> was flagged. It was:</p>

<p><blockquote>%s</blockquote></p>

<hr/>
<a href="%s">Keep it</a>
<hr/>
<a href="%s">KILL IT</a>"""

class Mailer():
    def send(self, id_, comment, author):
        pw = str(uuid.uuid4())
        emails.insert({'id': id_, 'pw': pw}).run(conn)

        for a in MODERATORS:
          self._do_send(a, id_, comment, author, pw)

    def _do_send(self, to, id_, comment, author, pw):
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'Flagged ASLO Comment'
        msg['From'] = MY_EMAIL
        msg['To'] = to

        keep_url = "http://localhost:5000/comments/keep/%s/%s" % (id_, pw)
        kill_url = "http://localhost:5000/comments/kill/%s/%s" % (id_, pw)

        text = TEXT_TEMPLATE % (author, comment, keep_url, kill_url)
        html = HTML_TEMPLATE % (author, comment, keep_url, kill_url)

        msg.attach(MIMEText(text, 'plain'))
        msg.attach(MIMEText(html, 'html'))

        s = smtplib.SMTP('smtp.sugarlabs.org', 587)
        s.ehlo()
        s.starttls()
        s.ehlo()
        s.login(EMAIL_UNAME, EMAIL_PW)
        s.sendmail(MY_EMAIL, [to], msg.as_string())
        s.quit()
