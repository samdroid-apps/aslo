# Mining Activities

Do you have some spare compute power?
Why not help ASLO by mining activities!

# Install

First you will need to install [Docker][1].  Tutorials for
[Fedora][2] and [Ubuntu][3].  You should also consider making
[docker accessable from non root users][4], as the bot will
need to use docker to isolate activity builds from your system.

Then you need to install the activity build docker environemnt:

    docker pull samdroid/activity-build

And make sure you have the other deps:

* Git
* Requests (Py2): `pip install requests`
* PoLib (Py2): `pip install polib`

Then just run `python2 main.py` and off you mine!

If you have any issues please create a GitHub issue, or
contact me.

NOTE: On systems with SELinux you need to change the permisions
of the bot's home directory (so that the activity build
docker can access the source code):

    chcon -Rt svirt_sandbox_file_t /home/sam/aslo/bot

[1]: http://www.docker.io/
[2]: http://docs.docker.io/installation/fedora/
[3]: http://docs.docker.io/installation/ubuntulinux/
[4]: http://askubuntu.com/questions/477551/how-can-i-use-docker-without-sudo
