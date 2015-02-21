from flask import Flask, send_file
import os

app = Flask(__name__)

@app.route('/')
def static_index():
    return send_file('index.html')

@app.route('/bundle')
def bundle():
    os.system('bash build.sh --quick')
    return send_file('_site/bundle')

@app.route('/<path:path>')
def static_file(path):
    return send_file(path)

if __name__ == "__main__":
    app.run()
    os.system('rm bundle index.css.map index.css main.js update.json data.json')
