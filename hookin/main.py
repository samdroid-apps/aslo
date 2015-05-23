import os
import json
from flask import Flask, request

from backend import handle_specials, hook_call_to_bus


app = Flask(__name__)


@app.route('/hook', methods=['POST'], strict_slashes=False)
def route_from_post_data():
    if 'application/json' in request.headers.get('Content-Type'):
        data = json.loads(request.data)
    else:
        data = json.loads(request.form['payload'])
    url = data['repository']['full_name']

    handle_specials(url)
    hook_call_to_bus(url)
    return 'Awsome!'


@app.route('/hook/<gh_user>/<gh_repo>')
@app.route('/hook/<gh_user>/<gh_repo>/<bundle_id>', methods=['POST'])
def route_from_url(gh_user, gh_repo, bundle_id=None):
    url = '{}/{}'.format(gh_user, gh_repo)
    handle_specials(url)
    hook_call_to_bus(url)
    return 'Thank you!'


if __name__ == '__main__':
    app.run(debug=os.environ.get('ASLO_DEBUG') == '1',
            host='0.0.0.0',
            use_reloader=False)
