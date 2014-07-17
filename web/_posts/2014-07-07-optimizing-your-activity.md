---
layout: post
title:  "Optimizing Your Activity"
date:   2014-07-07 13:33

pattern: "url(http://aslo.cf/assets/mountian_sunrise.png)"

by:        Sam
by_avatar: http://www.gravatar.com/avatar/673cabf7d0713b0c64b9d54f5ee5b2e2
---


## Introduction


If you have already [added your activity to the ASLO][add tutorial] you may now 
want to optimize it for the ASLO.  You can add screenshots, categories and
more to your activity.  Most of this involves adding/changing configuration
files within your activities git repository.

<br/><br/><br/>

## Basic Activity Information


Basic activity information (such as the title, version and icon) is taken from 
your activities `activity.info` file (located at `/activity/activity.info` 
in your git repository).  Make sure you fill it out fully.  Here is an example 
`activity.info` file broken down and explained:

----

`[Activity]`

This signifies the start of the file.

----

<pre><code class="big">bundle_id = me.samdroid.sugar.2048
exec = sugar-activity-web</code></pre>

These fields are used by Sugar, but not by the ASLO.
(It is a good idea to remember them, as your activity will not work otherwise).

----

`name = My Awesome activity`

The name field serves as the title for your activity.

----

`activity_version = 56`

The version number should be in an integer format and the version numbers should
be larger for newer releases.
>**NOTE**: Sugar supports version numbers with decimal points (eg: `2.6.3`).
> Unfortunately the ASLO only supports integer version numbers 
> (those with no decimal places)

----

`icon = activity-icon`

Icon provides the name of a svg icon in the `/activity` directory.  For example
`activity-icon` resolves to `/activity/activity-icon.svg`.

----

`summary = The coolest activity ever!`

This provides the description for your activity.

----

`categories = game maths`

These are the categories for your activity to display under in the ASLO. 
This is explained later in this tutorial.

----

> ### Pro Tip: Translating your title and summary
> Translating activities in Sugar uses the gettext po-file system.
> The ASLO uses this system too.
> 
> For the Turtle Block activity, the following excerpt from `/po/es.po` provides the
> translation for the activity's title
> 
> <pre><code class="big">
> msgid "TurtleBlocks"    (The English title - same as defined in activity.info)
> msgstr "TortuBlocks"    (The Spanish title)
> </code></pre>
> 
> **NOTE**: It is always assumed that the `activity/activity.info` 
> file is in English (en-US).

<br/><br/><br/>

## What's New

Data for the What's New section is from the `NEWS` file in your repository.
Translations are from `NEWS.language-code` files.
The expected format for these files is:

<pre><code class="big">Version Number (integer)

A description of this version.
It can be many lines long.

Version Number (integer)

A description of this version.
It can be many lines long.

...</code></pre>

[A real life example can be seen here.](https://github.com/walterbender/turtleart/blob/a7fb72b5dc6c6e6da8b35cffc530f07d119fec90/NEWS)

<br/><br/><br/>

## Categories


Categories are specified in the `activity/activity.info` file.  The syntax is:



`categories = CATEGORY1 CATEGORY2 CATEGORY3...`



> **Pro Tip**: Categories are case sensitive


The following categories are available (with their name to put in the 
`activity.info`):


* `game`
* `programming`
* `robotics`
* `internet`
* `science`
* `maths`
* `geography`
* `documents`
* `music`
* `media`
* `art`
* `tools`
* `system`
 
**NOTE: This is subject to change as the ASLO is still in development**

<br/><br/><br/>

## Screenshots


Screenshots are in the PNG format.  If you have an XO, you can take these
screenshots by pressing `ALT-1` and locating the screenshot in your journal.


The screenshots are then placed in directories inside your git repository. 
The format for naming these directories is `/screenshots/language-COUNTRY/`
or `/screenshots/language`.  The latter is recomended and the former
should only be used when there are cultural differences.  Some example directry
names are `/screenshots/en/` and `/screenshots/es-UY`.  The screenshot must be
placed inside the appropriate directory and end with `.png`.


> **Pro Tip**: [Find your browser's language code][1] - that is the same
> language code format used for naming the directories

<br/><br/><br/>

### Conclusion


There are a few ways that you can eaisly optimize your activity for the ASLO.
You can add screenshots, translations, categories and basic data.
After committing these changes, you can `git push` and your changes will be
available on the ASLO one the buildbots are able to process your activity. 


Optimizing your activity will make it easier for users to discover your
activity, and put more smiles on peoples faces.


[add tutorial]: /blog/adding-your-activity/ "Add your activity to the ASLO"
[1]: http://jsfiddle.net/2a6xd/1/embedded/result/

