# Recommendations Server

This provides people with a list of suggested activities.
It uses the comments database to get the data.

# Running

You will need the comments db up and running.
If you are on an x86_64, I think you can just run `./recommend`.

Otherwise just:

* Install Go
* `go get github.com/dancannon/gorethink`
* In this folder:
* `go build && ./recommend`

# Code Layout

Go auto imports code from the same folder.
It puts all of the files in one namespace.
The convention goes that public methods start with a Capital Letter.

* `main.go`: The HTTP Server
* `backend.go`: The program for making the recommendations
* `models.go`: All the structs/classes used in data interchange
