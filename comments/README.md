# ASLO Comments System

It just takes the comments and puts them in a database.
It uses a secure^ login system.

# Running

First install

* Flask (Py2)
* Twisted (Py2)
* TxWS (`pip install txws`)
* RethinkDB

Start RethinkDB and make sure you have the `comments` and `users` table in the `comments` database.
Then run `python main.py`


# Notes

^ It uses sha1 and salts... not cracked yet!
