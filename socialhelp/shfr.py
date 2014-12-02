import os
import os.path
import json
import requests
from subprocess import call
from flask import Flask, redirect, jsonify

from helpers import crossdomain
import fc

DATA_DIR = os.environ['DATA_DIR']
SOCIALHELP = 'https://socialhelp.sugarlabs.org'
mappings = {}

app = Flask(__name__)

@app.route('/')
def index():
    return redirect(SOCIALHELP)

@app.route('/goto/<id>')
def goto(id):
    if id in mappings:
        return redirect('{}/c/{}'.format(SOCIALHELP, mappings[id]))
    else:
        return redirect('{}/t/category-not-found/'.format(SOCIALHELP))

# Max amount of topics to show for comments
MAX_TOPICS = 50

def compress_forum_json(big_data):
    users_list = big_data['users']
    users = {i['id']:i for i in users_list}

    if len(big_data['topic_list']) > MAX_TOPICS:
        big_topics = big_data['topic_list'][:MAX_TOPICS]['topics']
    else:
        big_topics = big_data['topic_list']['topics']

    topics = []
    for t in big_topics:
        print t
        if t['pinned'] or not t['visible']:
            continue

        topics.append({
            't': t['title'],
            's': t['slug'],
            'p': t['posts_count'],
            'l': t['like_count']})
    return topics, len(big_data['topic_list'])-1

@app.route('/goto/<id>.json')
@crossdomain('*')
def goto_json(id):
    if id in mappings:
        url = '{}/c/{}.json'.format(SOCIALHELP, mappings[id])
        r = requests.get(url, verify=False)
        if r.ok:
            data, count = compress_forum_json(r.json())
            return jsonify(success=True, data=data, count=count)
    return jsonify(success=False)

@app.route('/pull', methods=['POST'])
def pull():
    oldwd = os.getcwd()
    os.chdir(DATA_DIR)
    call(['git', 'pull'])
    os.chdir(oldwd)

    fc.main()
    make_cache()
    return 'Cool Potatoes'

@app.route('/mappings')
def mappings_view():
    return json.dumps(mappings)

def make_cache():
    global mappings
    for p, id in ((os.path.join(DATA_DIR, f), f.rstrip('.json')) 
                   for f in os.listdir(DATA_DIR)
                   if os.path.isfile(os.path.join(DATA_DIR, f))):
        if p.endswith('.json') and 'featured.json' not in p:
            activity = json.load(open(p))
            mappings[id] = activity.get('socialhelp_category')

make_cache()
app.run(port=8000, debug=False, host='0.0.0.0')
