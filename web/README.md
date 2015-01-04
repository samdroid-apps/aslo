
# Web Interface

This provides a way to download activities and search.
You can view it live at http://www.aslo.cf

# Running

This uses a lot of preprocessors, so you will need to install them:

	pip install polib
	npm install browserify
	gem install sass

Use the `build.sh` script to build the site.  Use your favourite HTTP server to
serve the website:  `cd _site; python -m SimpleHTTPServer`.

You may need to run `window.replaceCache()` in your browser to force the app
level cache to reload.

To update the pot file (should be done pre-commit):

	python genpo.py
