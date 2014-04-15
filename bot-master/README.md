# ASLO Bot Master

This is the bot that controls all the slaves.

It keeps ASLO records updated.

## Running

[Note] Wanted to mine activities? See the /bot folder

First install:

* Flask (Py2)
* Git
* RethinkDB

Start RethinkDB and make sure you have the tables `bots` and `repos` in the db `bot_master`.
Clone the registery repo into a folder named git.
Then just run `./run.sh`
