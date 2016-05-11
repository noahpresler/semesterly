qcumber-scraper
===============

This is the component of Qcumber that scrapes the data off SOLUS, parses it, and generates structured data that the site can then display.

Setup Guide
===========

* This guide has been verified for Ubuntu 11.10 and 12.10.
* Setting up on mac OSX should be quite similar. It will be verified soon.
* It works on Windows, but installation there is left as an exercise for the reader.

1. Installing the Prerequisites
-------------------------------

* Make sure you have all the needed permissions to install.
* For most users, this means prepending each install command with `sudo`
* Ex: `sudo apt-get install ...`

### Python and Libraries ###

This project has been designed to work with Python versions 2.7.x and 3.3.x You can try other versions, but no promises.

Python 3.3.x is recommended.

* Install a compatible version of Python. Use a package manager (Ex: `apt-get install python3 python3-dev`),
  or get the source from [http://www.python.org/download/](http://www.python.org/download/) if your distribution doesn't have the correct version of Python availible.
* Make sure to also install the developement libraries (packages `python3-dev` or `python2-dev`). If you compile from source, these are already included.
* Install extra libraries needed for compiling the `lxml` module:
    - Most Debian-based distros: `apt-get install libxml2-dev libxslt1-dev`
    - Red Hat/Fedora: `yum install libxml2-devel libxslt-devel`
    - Arch: `pacman -S libxml2 libxslt`

### Git and a Github account ###

* Go to [https://github.com/](https://github.com/) and follow the instructions to register an account.
* Run `apt-get install git` to install Git.
* Follow the guide at [https://help.github.com/articles/set-up-git](https://help.github.com/articles/set-up-git) to set up Git.

### Pip and a Virtual Environment ###

Pip is used to install extra Python modules that aren't included by default.
A virtual environment is an isolated Python environment. It allows for per-program environment configuration.

* Install Pip by running `apt-get install python3-pip` (or `python-pip` for 2.7.x users)
* Once Pip is installed, run `pip install virtualenv`
* The virtual environment will be configured later.

2. Fork the Repository
----------------------

* Click the "Fork" button at the top-right of [https://github.com/Queens-Hacks/qcumber-scraper](https://github.com/Queens-Hacks/qcumber-scraper)
* You now have your own copy of qcumber-scraper that you can safely mess around with!

3. Clone it to your computer
----------------------------

* Copy the `git@github.com:[yourusername]/qcumber-scraper.git` link on the page.
* Open up a terminal window.
* Navigate to the folder in which you want to store your local copy of the scraper.
* Clone the repository. `git clone [repository]`, where `[repository]` is the url you copied.
* You should now have a `qcumber-scraper` folder.


4. Create and Activate a Virtual Environment
--------------------------------------------

* Navigate into the `qcumber-scraper` folder
* Create a new virtual environment: `virtualenv venv`
* If you have multiple versions of Python on your system, make sure to specify the correct one with a `-p` switch (Ex: `virtualenv -p /usr/bin/python3 venv`)
* Activate the new environment: `source venv/bin/activate`

* NOTE: you will need to activate the virtual environment every time you want to run the local project.

* To deactivate the virtual environment: `deactivate`


5. Install Required Packages
----------------------------

Make sure you have activated your virtual environment (see above) before running this command!

* `pip install -r requirements.txt`
* If this command reports an error, check the log to see if you have all the dependencies required.


Runnning a scrape
=================

The standard maintenance periods are Tuesdays and Thursdays from 5 am to 7:30 am and Sundays from 5 am to 10 am. There doesn't seem to be any place this is documented, but if you access the site during maintenance times it will tell you. You will need to run scrapes around these maintenance times.

* Make sure your virtual environment is activated.
* Make you you have created a config.py
* To do a solus scrape run `python main.py`
* To do a textbook scrape run `python textbooks.py`

### Better Logging ###

For better logging and debugging later it is recommended to redirect the output to log files. Something like:
`python main.py >logs/debug.log 2>logs/error.log`

To watch the logs as they happen, first open 2 other terminals, and run `tailf logs/debug.log` in one, and `tailf logs/error.log` in the other. Then start the main scrape command like above.
