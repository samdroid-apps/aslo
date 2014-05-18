# ASLO Comments System

It just takes the comments and puts them in a database.
It also logs the users in via Persona.

# Running

First install

* Flask (Py2)
* Twisted (Py2)
* TxWS (`pip install txws`)
* RethinkDB

Start RethinkDB and make sure you have the `comments` table in the `comments` database.
Then run `python main.py`
