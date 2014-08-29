# Mining Activities

Do you have some spare compute power?
Why not help ASLO by mining activities!

## Easy Docker Install

First you will need to install [Docker][1].
Tutorials for [Fedora][2] and [Ubuntu][3].

Then you will need to (as root):

    docker pull samdroid/aslo-bot
    docker run samdroid/aslo-bot

And then your up and running

## Manual Install

`WARNING`: This is dangerous since it will run untrusted code on your computer
and could EAT YOUR COMPUTER!

First make sure you have:

* Git
* Requests (Py2): `yum install python-requests`
* PoLib (Py2): `pip install polib`
* Sugar - not running, but just so the setup.py files can work

Then just run `python2 main.py` and off you mine!

If you have any issues please contact me.

[1]: http://www.docker.io/
[2]: http://docs.docker.io/installation/fedora/
[3]: http://docs.docker.io/installation/ubuntulinux/
