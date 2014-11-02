# Socialhelp - ASLO integration

These scripts integrate the ASLO activities with social help.

Before you can run these, you need to enter your discourse API key into the
`config.json` file.  You also need to `git clone` the sugar activities repo
and enter the path of that repo in `config.json`.

The `shfr.py` script provides a ASLO based version of samdroid-apps/shfr.

The `fc.py` script creates categories for each activity on your forum.
This script is automatically run when `/pull` is called on the shfr.
