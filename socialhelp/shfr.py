import os
import os.path
import json
from subprocess import call
from flask import Flask, redirect

import fc

# config = json.load(open('config.json'))
DATA_DIR = os.environ['DATA_DIR']
SOCIALHELP = 'http://socialhelp.sugarlabs.org'
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

@app.route('/pull')
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
