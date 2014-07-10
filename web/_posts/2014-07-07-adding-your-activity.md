---
layout: post
title:  "Adding Your Activity"
date:   2014-07-07 13:33

pattern: "linear-gradient(45deg, #f06, yellow)"

by:        Sam
by_avatar: http://www.gravatar.com/avatar/673cabf7d0713b0c64b9d54f5ee5b2e2
---

### Introduction


The new ASLO provides users with a new way to discover and download activities.  It also provides and enhanced experience for developers.  Adding your activity is a painless experience for activities which are hosted on GitHub.  If your activity is not on GitHub, you should [migrate it to GitHub](https://help.github.com/articles/importing-an-external-git-repository) before adding it to the new ASLO.


## Submitting your activity


All new activities must be checked by a human before they can be published.  In order to submit your activity you first must fork [sugar-activities](https://github.com/samdroid-apps/sugar-activities).  Then select the `data.json` file and click `edit`.  Fill out the following (interactive) template and paste it below line 2 (`"activities": {`) in the file.


<pre><code class="big">        "<span contenteditable>Your Activity's Bundle ID</span>": {
            "by": [
                {
                    "name": "<span contenteditable>Your Name</span>", 
                    "page": "<span contenteditable>Your Website or GitHub profile URL</span>",
                    "email": "<span contenteditable>Your Email Address</span>"
                }
            ]
        },
</code></pre>


Then scroll down, enter a commit message (eg: Added My Awesome Activity) and press `commit`.  After that you will need to submit a pull request.  Click the little green pull request button (back on the repository main page) then click `Create pull request`.  Please include your activity's link in the pull request description.


Once you have submitted the pull request, your activity will be reviewed.  If your activity is approved, you can move on to building/uploading your activity.


## Building/Uploading your activity


The new ASLO tightly integrates with GitHub, so building is as simple as adding a webhook.  To add the webhook, go to your activity's GitHub repository.  Then go into the settings (the icon on the right), into Webhooks & Services (the menu item on the left) and click `Add webhook`.  Fill out the following (interactive) template and put it in the payload URL field.


<pre><code>http://aslo-bot-master.sugarlabs.org/hook/<span contenteditable>GitHub User name</span>/<span contenteditable>GitHub Repository Name</span>/<span contenteditable>Activity Bundle ID</span></code></pre><br/>


After filling out the payload URL, click `Add webhook`.  Your activity will be automatically placed on the new ASLO next time you `git push`.


### Conclusion


After you have gone through the process of adding your activity, you can [go and see it online](http://aslo.cf).  The activity is now avaiable for users around the world!  You may want to [optimize your activity for the new ASLO](/blog/optimizing-your-activity), so users can see screenshots, descriptions and more.
