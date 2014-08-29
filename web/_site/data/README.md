# Sugar Activities

This contains all the data for ASLO activities

# Adding yours

First create a new file for your activity.  It should be named `BUNDLE_ID.json` (for example: `com.example.activity.json`).  Then add the following contents:

    {
        "by": [
                {
                    "name": "YOUR_NAME", 
                    "page": "YOUR_SITE"
                }
            ]
    }

Then send us a pull request. Someone will look at your activity.

**NOTE:** It is a good idea to use [a json checker](http://jsonlint.com/) before you commit.

# Hooking it up

You should then add a github web hook for your activity.
That means the bots will build and do stuff for you.
They build from master, but don't worry about different branches for stable and
testing; the bots automatically see when you change the version number.
The webhook address is:

    http://aslo-bot-master.sugarlabs.org/hook/GITHUB_USER/GITHUB_REPO/BUNDLE_ID

eg:

    http://aslo-bot-master.sugarlabs.org/hook/samdroid-apps/sugar-slides/me.samdroid.sugar.slides

Use the webhook for `only push events`. That is the default option.

# Getting ready for the bots

* Make sure you have a setup.py
* Put your screenshots in `/screenshots/LANG/`. eg: `/screenshots/en/1.png`
* Add summary and title to activity.info
* Translate activity.info (if you can) using po files
* Add the `tags` to your `activity.info`

# See it live

First do a push, and after one of the bots has compiled your activity, go to http://aslo.cf!
