import json

from termcolor import colored
import requests
import click
from getpass import getpass

API = 'http://comments.aslo.cf'
SITE = 'http://www.aslo.cf'

@click.group()
def cli():
    pass

@click.command()
def login():
    username = raw_input('Username: ')
    password = getpass('Password: ')
    r = requests.post(API + '/login',
                      data={'username': username, 'password': password})

    if not r.ok:
         print colored('[ERROR]', 'red'), \
               colored('Server error', on_color='on_red')
         return

    j = r.json()
    if j['error']:
       print colored('[ERROR]', 'red'), colored(j['msg'], on_color='on_red')
       return

    with open('.aslo-token', 'w') as f:
        json.dump({'token': j['token'], 'username': username}, f)
    print colored('Logged in', 'green')

cli.add_command(login)

def get_token():
    with open('.aslo-token') as f:
        return json.load(f)

def y(x):
    return colored(x, 'yellow')

def b(x):
    return colored(x, 'blue')

def show_comment():
    r = requests.get(API + '/comments/flagged', data=get_token())
    if not r.ok:
        print colored('[ERROR]', 'red'), \
              colored('Server error (try re-logging in)', on_color='on_red')
        return False

    j = r.json()
    if j['empty']:
        print colored('No more comments to moderate', 'yellow')
        return False

    c = j['data']

    print colored('Flagged comment', 'yellow', attrs=['underline']), \
          '%s/view/%s/comment=%s' % (SITE, c['bundle_id'], c['id'])
    print y('By'), c['user']
    print y('Type'), c['type']
    print y('Content:')
    print c['text']
    print '\n'

    i = raw_input('Do you want [%s]nflag the comment, [%s]lete the comment'
                  ' or [%s]uit moderation? ' % (b('u'), b('d'), b('q'))).lower()
    if i == 'u':
        r = requests.get(API + '/comments/unflag/' + c['id'], data=get_token())
        if r.ok:
            print colored('Comment unflagged', 'green')
        else:
            print colored('[ERROR]', 'red'), \
                  colored('Server error', on_color='on_red')
            return False
    elif i == 'd':
        r = requests.get(API + '/comments/delete/' + c['id'], data=get_token())
        if r.ok:
            print colored('Comment deleted', 'green')
        else:
            print colored('[ERROR]', 'red'), \
                  colored('Server error', on_color='on_red')
            return False
    else:
        return False
    return True


@click.command()
def moderate():
    while show_comment():
        print chr(12)
    print colored('Thank you for moderating!', 'magenta')

cli.add_command(moderate)

if __name__ == '__main__':
    cli()
