---
layout: post
title:  "Adding Your Activity"
date:   2014-07-07 13:33

pattern: "linear-gradient(45deg, #f06, yellow)"

by:        Sam
by_avatar: http://www.gravatar.com/avatar/673cabf7d0713b0c64b9d54f5ee5b2e2
---


Adding your activity is super easy if your activity is hosted on GitHub.  If
your activity is, just follow the steps below.  Otherwise, it would be wise to
[migrate your activity to a GitHub repository][tgh].


First make a fork of [sugar-activities][sa].  On the GitHub web interface,
click `data.json` then click `edit`.


Directly below line 2 (`"activities": {`) fill out and insert the following 
template:


<pre><code class="big">        "<span contenteditable>YOUR_BUNDLE_ID (edit us!)</span>": {
            "by": [
                {
                    "name": "<span contenteditable>YOUR_NAME</span>", 
                    "page": "<span contenteditable>YOUR_SITE</span>",
                    "email": "<span contenteditable>YOUR_EMAIL</span>",
                }
            ]
        },
</code></pre>


After you have filled out and inserted that template, scroll down and enter 
a commit message, something like `Added MY_ACTIVITY`.  Click `Commit Changes` 
and then submit a pull request (pull request icon -> `New pull request` 
-> `Create pull request`).

Then you will need to add a webhook to you GitHub repository so the buildbots
can automatically compile your activity.  Click `Settings` on the right hand
side of your activity's repository's main page (not the `sugar-activity` repository).
Click `Webhooks & Services` (on the left) then `Add webhook` (top right).
Fill out the following template and put that in the `Payload URL` field.


<pre><code>http://aslo-bot-master.sugarlabs.org/hook/<span contenteditable>GITHUB\_USER</span>/<span contenteditable>GITHUB\_REPO</span>/<span contenteditable>BUNDLE\_ID</span></code></pre><br/>


(eg: `http://aslo-bot-master.sugarlabs.org/hook/samdroid-apps/sugar-slides/me.samdroid.sugar.slides`)


Then, wait for your pull request to be accepted.  Once it is, your activity will
be live on the ASLO!

> **Pro Tip**: [Optimize your activity for the ASLO][o]

[tgh]: https://help.github.com/articles/importing-an-external-git-repository
[sa]: https://github.com/SAMdroid-apps/sugar-activities
[o]: /blog/optimizing-your-activity/
