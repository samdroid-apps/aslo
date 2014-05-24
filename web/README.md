# Web Interface

This provides a way to download activities and search.
It is a bit uguly now so we must work on that now.

# Running

	cd ~/aslo/web

    sudo npm install -g watchify  # If needed
    cd js
    watchify main.js -o outp.js -d -v &
    cd ..

	python -m SimpleHTTPServer

Then goto `0.0.0.0:8000` in your browser

You also need to setup your SASS auto-compiler. 
[Try Koal](http://koala-app.com/).
