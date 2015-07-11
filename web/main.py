import os
import json
import thread
import requests
from datetime import datetime
from flask.ext.babel import Babel
from flask import Flask, render_template, send_from_directory, \
                  request, redirect, abort, Response

import backend
from pykafka import KafkaClient
from i18n import get_localized_text

app = Flask(__name__)
Babel(app)
app.jinja_env.add_extension('jinja2.ext.i18n')
app.jinja_env.install_null_translations(newstyle=True)
app.jinja_env.globals.update(reversed=reversed)  # IDK
app.jinja_env.globals.update(datetime=datetime)
app.jinja_env.globals.update(l=get_localized_text)
app.jinja_env.globals.update(embed_icon=backend.embed_icon)

@app.route('/')
@app.route('/page/<int:page>')
def index(page=1, size=18):
    total = len(backend.ALL_BUNDLE_IDS)
    if total < size*(page-1):
        return abort(404)

    ids = backend.ALL_BUNDLE_IDS[size*(page-1):min(total, size*page)]
    activities = zip(ids, map(backend.get_basic_activity, ids))
    not_last_page = total > size*(page)

    return render_template('index.html', page_number=page,
                          activities=activities, featured=backend.FEATURED,
                          not_last_page=not_last_page)


@app.route('/view/<id>')
def view(id):
    activity = backend.get_activity(id)
    if activity is None:
        return abort(404)

    try:
        r = requests.get('https://use-socialhelp.sugarlabs.org'
                         '/goto/%s.json' % id)
        socialhelp = r.json()
    except requests.exceptions.RequestException:
        socialhelp = {success: False}

    return render_template('activity.html', activity=activity,
                           socialhelp=socialhelp, bundle_id=id)


@app.route('/search')
def search():
    query = request.args.get('query')
    category = request.args.get('category')
    if not (query or category):
        return redirect('/')

    ids = backend.ALL_BUNDLE_IDS
    if category:
        ids = [i for i in ids if category in \
               backend.get_basic_activity(i)['categories']]
    if query:
        query = query.lower()
        ids = [i for i in ids if query in get_localized_text(
                    backend.get_basic_activity(i)['title']).lower()]

    activities = zip(ids, map(backend.get_basic_activity, ids))
    return render_template('search.html', activities=activities,
                           query=query, category=category)


@app.route('/update.json')
def update_json():
    return Response(backend.UPDATE_JSON, mimetype='application/json')


@app.route('/static-cache/<path:path>')
def static_cache(path):
    return send_from_directory('static-cache', path)


@app.route('/static/<path:path>')
def static_static(path):
    return send_from_directory('static', path)


def poll_kafka():
    client = KafkaClient(hosts='freedom.sugarlabs.org:9092')
    consumer = client.topics['org.sugarlabs.hook'].get_simple_consumer(
        consumer_group='aslo-web-interface',
        auto_commit_enable=True)

    for msg in consumer:
        try:
            data = json.loads(msg.value)
        except ValueError:
            print 'Invalid json in message', msg.offset, msg.value
            continue

        if data.get('clone_url') == \
           'https://github.com/samdroid-apps/sugar-activities':
            backend.pull_activities()


if __name__ == '__main__':
    os.system('sass sass/index.sass:static-cache/index.css')
    backend.cache()

    thread.start_new_thread(poll_kafka, ())
    app.run(host='0.0.0.0', debug=True)
