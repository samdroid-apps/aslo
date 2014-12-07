
# Web Interface

This provides a way to download activities and search.
You can view it live at http://www.aslo.cf

# Running

This uses a lot of preprocessors, so you will need to install them:

	pip install polib
	npm install watchify
	gem install sass
	gem install jekyll

Then you have to run them all

	cd aslo/web/js
	watchify main.js -o outp.js -v &
	cd ..
	python compile_po.py
	jekyll serve --watch

Then go to http://0.0.0.0:4000 in your browser

To update the pot file (should be done pre-commit):

	python genpo.py
