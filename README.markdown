Introduction
------------

SABnzbPre is a SABnzbd+ remote for the Palm WebOS platform. It requires SABnzbd+ 0.5.0 or newer. Don't try to use it with 0.4.x, it won't work. Please visit http://sabnzbd.org for more information. Here are a few screenshots to give you an idea of what you're getting into:

![](http://dl.dropbox.com/u/282415/SABnzbPre/027-queue.png) ![](http://dl.dropbox.com/u/282415/SABnzbPre/0210-add-nzb.png) ![](http://dl.dropbox.com/u/282415/SABnzbPre/027-connections.png) ![](http://dl.dropbox.com/u/282415/SABnzbPre/027-server-info.png)

Installation
------------
The easiest method of installation is to visit the [SABnzbd Remote for WebOS](http://developer.palm.com/webChannel/index.php?packageid=com.davehayes.sabnzbpre) page on Palm's website.

You can also download the ipk file directly ([version 0.2.10](http://github.com/downloads/daveisadork/SABnzbPre/com.davehayes.sabnzbpre_0.2.10_all.ipk) is the newest, older versions can be found in the [Downloads](http://github.com/daveisadork/SABnzbPre/downloads) section). Instructions on how to install that file (and other homebrew apps for WebOS) can be found at [PreCentral.net](http://www.precentral.net/how-to-install-homebrew-apps). If one were so inclined, he could also try the app using the emulator included with the [Mojo SDK](http://developer.palm.com/index.php?option=com_ajaxregister&view=register&sdkdownload). 

Partial changelog
-----------------

Version 0.2.10 (2010-03-13)

* Adds the ability to force grabbing of Newzbin bookmarks
* Fixes some small text color issues

Version 0.2.9 (2010-03-11)

* Adds the ability to set an action to be executed upon queue completion

Version 0.2.8 (2010-02-27)

* Fixes progress bar rendering in WebOS 1.4.

Version 0.2.7 (2010-02-26)

* Gives a bit more information when "Test These Settings" on the Connections screen fails.
* Has a few improvements to memory usage, specifically with a very large number of items in the history.

Version 0.2.6 (2009-12-29)

* Removes the HTTPS option, because as far as I can tell, it's impossible to do Ajax requests with HTTPS in WebOS. Which is stupid.
* Fixes a lot of little bugs
* Some internal code cleanup that should hopefully improve performance a bit

Version 0.2.5 (2009-12-22)

* Internal browser is more responsive to taps/clicks 
* Internal browser now has forward and back buttons as well as a page title and proper loading progress widget
* Adds the ability to use connection profiles  
* Adds a basic server information page
* Adds the ability to pause temporarily ("Pause for...")
* Adds a spinner in place of the refresh button while requesting data
* Heaps of minor visual tweaks
* More internal stuff that only I care about

Version 0.2.4 (2009-12-15)

* More internal changes that really only affect me
* Makes most errors much less obtrusive and annoying

Version 0.2.3 (2009-12-14)

* Changes queue item layout again (experimenting with different progress indicators)
* Adds support for item level pause/resume
* Configuration UI changes in preparation for some upcoming stuff

Version 0.2.2 (2009-12-11)

* Adds support for browsing NZBMatrix (although it seems a little flaky at this point)
* Will disable the "Browse Newzbin" and "Browse NZBMatrix" buttons if you don't have those sites configured in SABnzbd+

Version 0.2.1 (2009-12-10)

* Adds the ability to set a download speed limit
* Adds subtle cues for paused queue items and failed history items
* Uses a background image that I'll probably have to change in the future

Version 0.2.0 (2009-12-09) is a major rewrite of most of the inner workings of the app to hopefully improve the general overall operation. Other changes include:

* The obvious change to palm-dark
* Slight re-design of queue item layout, most notably the addition of a progress bar
* History items now include the size of the download as well as checking/unpacking progress and failure details
* The preferences scene will let you test your settings
* The Add Download scene will now dynamically load your categories and scripts so you can pick something other than the default
* You can specify a path now, which is useful if you're using reverse proxying and have it mapped to something other than /sabnzbd (in other words, you can connect to http://yourhostname:80/usenet if you want)
