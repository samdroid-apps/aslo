
# Web Interface

This provides a way to download activities and search.
You can view it live at http://www.aslo.cf

# Running

This uses a lot of preprocessors, so you will need to install them:


	npm install watchify
	gem install sass
	gem install jekyll

Then you have to run them all

	cd aslo/web/js
	watchify main.js -o outp.js -v &
	cd ..
	jekyll serve --watch

Then go to http://0.0.0.0:4000 in your browser

