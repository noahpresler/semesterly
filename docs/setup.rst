.. _setup:

Installation
=============

This guide will bring you through the steps of creating a local Semester.ly server and development environment. It will walk through the setup of the core ecosystems we work within: Django/Python and React/Node/JS. It will additionally require the setup of a PostgreSQL database.

Setting up Visual Studio Code
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
We recommend using `Visual Studio Code <https://code.visualstudio.com/>`_
(VSCode) for its integration with WSL, Docker, and the Postgres database. This 
section assumes you will be using Visual Studio Code for development with 
Semester.ly.

1. If you are on Windows OS, see the following guide on
installing Windows Subsystem for Linux (WSL) `here
<https://docs.microsoft.com/en-us/windows/wsl/install-win10>`_. We recommend 
choosing Ubuntu 20.04 as your linux distribution. Make sure you take the extra
steps to enable WSL 2 as it will be required for Docker.

After WSL 2 is installed, install the Remote - WSL extension by Microsoft in
VSCode. This will allow you to open a VSCode window within your linux
subsystem. Press Ctrl+Shift+P and select the option Remote-WSL: New WSL Window.

2. Install the Docker extension by Microsoft and the Postgres extension by 
Chris Kolkman.

3. Ensure that you are in a WSL Window in VSCode before continuing to the next 
step. You can open a terminal by selecting the menu option ``Terminal -> New
Terminal``.

Fork/Clone The Repository
~~~~~~~~~~~~~~~~~~~~~~~~~
Forking Semester.ly will create your own version of Semester.ly listed on your GitHub!
Cloning your Semester.ly fork will create a directory with all of the code required to run your own local development server. Navigate to the directory you wish to work from, then execute:

1. **Fork** navigate to our `GitHub repository <https://github.com/jhuopensource/semesterly/>`_ then, in the top-right corner of the page, click Fork.

2. **Clone** by executing this line on the command line:

    .. note:: **ATTENTION:** Be sure to replace [YOUR-USERNAME] with your own git username

    .. code-block:: bash

         git clone https://github.com/[YOUR-USERNAME]/semesterly

3. Set up the upstream remote to jhuopensource/semesterly:

    .. code-block:: bash

        git remote add upstream https://github.com/jhuopensource/semesterly

Setting up Docker
~~~~~~~~~~~~~~~~~
Steps are below on getting your local development environment running:

1. **Download and install docker** for your environment (Windows/Mac/Linux are supported)
    https://www.docker.com/get-started

2. Create **semesterly/local_settings.py** as follows:

    .. code-block:: bash

        DEBUG = True
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.postgresql_psycopg2',
                'NAME': 'postgres',
                'USER': 'postgres',
                'PASSWORD': '',
                'HOST': 'db',
                'PORT': '5432',
            }
        }

    .. note:: **ATTENTION:** When you clone the repo, you get a folder called semesterly and inside there is another folder called semesterly. Put this in the second semesterly folder.

3. Edit **semesterly/dev_credentials.py** and add a value for JHU_API_KEY in single quotes like below.

    You can request this API KEY from http://sis.jhu.edu/api.

    .. code-block:: bash

        'JHU_API_KEY': 'xxxxxxxx',

    .. note:: **ATTENTION:** This is also in the second semesterly directory.

        Now run this command in your terminal to make sure that this file isn't tracked by Git and your API key stays local to you.

    .. code-block:: bash

        git update-index --skip-worktree semesterly/dev_credentials.py

    *Alternatively*, you may create **semesterly/sensitive.py** as follows:

    .. code-block:: bash

        SECRETS = {
            'JHU_API_KEY': 'xxxxxxxx',
            # Other sensitive information goes here
        }

    This file will automatically be ignored by git. Be sure to replace
    'xxxxxxxx' with your own API key.

4. Add this entry to your hosts file as follows (This file is in c:\\Windows\\System32\\drivers\\etc\\hosts or /etc/hosts)

    .. code-block:: bash

        127.0.0.1       sem.ly jhu.sem.ly

    .. note:: **ATTENTION:** If you're working on other schools, add their URLs here as well (i.e. uoft.sem.ly for University of Toronto).

5. Launch terminal or a command window and run:

    .. code-block:: bash

        docker-compose build
        docker-compose up

    The **build** command creates a local Database and build of your source code.
    The **up** command runs everything. Be careful not to build when you don't need to as this will destroy your entire database and you'll need to ingest/digest again to get your course data (which takes about 30 minutes).

    .. note:: If you are using WSL 2, you may, but not necessarily, need 
    additional setup described in this `guide
    <https://docs.docker.com/desktop/windows/wsl/>`_. If you run into 
    additional errors, try the following:
    1. Change "buildkit" from ``true`` to ``false`` in Settings -> Docker Engine. 
    2. Refer to the Docker troubleshooting document `here
    <https://github.com/microsoft/vscode-docker/wiki/Troubleshooting>`_

    You now have Semester.ly running. If this is the first time, you will want some data which done in the next step.

6. Getting JHU data for a given term. In a new terminal run the following

     .. code-block:: bash

        docker exec -it $(docker ps -q -f ancestor=semesterly) /bin/bash
        * OR *
        docker exec -it $(docker ps -q -f ancestor=semesterly) shell

     This will put you inside of the shell. Now you can get courses by running these commands:

     .. code-block:: bash

         python manage.py ingest jhu --term Fall --years 2021
         python manage.py digest jhu

<<<<<<< HEAD
7.  Open a browser and visit http://jhu.sem.ly:8000 and hack away.
    You can skip ahead to **Advanced Configuration** or **How it All Works** now.
=======
7.  Open a browser and visit https://jhu.sem.ly or http://jhu.sem.ly:8000 (timetable view) and hack away. Visit http://localhost:8000 to view the landing page.
    You can skip ahead to `Advanced Configuration <advancedconfig.html>`_ or `How It Works <howitworks.html>`_ now.

Option 2: Setup using a Python Virtual Environment
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Make sure you have installed **Python 3.8.5**. If you have not you can `follow this <https://wiki.python.org/moin/BeginnersGuide/Download>`_. Please also download the python installer, `PIP (install guide) <https://pip.pypa.io/en/stable/installing/>`_. We will now install and setup a python virtual environment. This keeps your dependencies for other projects and classes seperate from those required for Semester.ly.

Install virtualenv:

.. code-block:: bash

    sudo pip3 install virtualenv

Create a virtual environment called ``venv``:

.. code-block:: bash

    virtualenv -p /usr/bin/python3.8 venv

To enter your virtual environment, execute the following code from your Semesterly directory:

.. code-block:: bash

    source venv/bin/activate

.. note:: Be sure to execute the above "source" command anytime you're working on Semesterly!

Check your OS info
~~~~~~~~~~~~~~~~~~
If using Linux (Ubuntu, Fedora, CentOS, etc.), you can usually find your version info with this code:

.. code-block:: bash

    cat /etc/issue

Install PostgreSQL
~~~~~~~~~~~~~~~~~~
Before installing the python requirements, make sure to have PostgreSQL setup.

**On mac**, `install Homebrew <https://brew.sh/>`_ and run:

.. code-block:: bash

    brew install postgres
    pg_ctl -D /usr/local/var/postgres start && brew services start postgresql

**On Ubuntu 18.x.x or Ubuntu 20.x.x** use apt-get:

.. code-block:: bash

    sudo apt-get update
    sudo apt-get install postgresql python-psycopg2 libpq-dev libxslt-dev libxml2-dev

**On CentOS / Fedora** use yum:

.. code-block:: bash

    sudo yum install postgresql gcc python-lxml postgresql-libs libxslt-devel libxml2-devel

Install Python Requirements
~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. note:: **ATTENTION MAC USERS:** you must install the xcode command line tools via ``xcode-select --install`` before proceeding.

All python dependencies are kept in a file called ``requirements.txt``. Anytime a dependency is added or changed, we update it in this file. To bring your virtual environment up to date with all of these requirements easily, simply execute:

.. code-block:: bash

    pip3 install --upgrade pip
    pip3 install -r requirements.txt

Install Node Packages
~~~~~~~~~~~~~~~~~~~~~~
Node and node package manager are the backbone of our frontend setup. To begin, install Node Package Manager (npm).

**On mac**:

.. code-block:: bash

    brew install node

**On Ubuntu 18.x.x or Ubuntu 20.x.x**:

.. code-block:: bash
    
    sudo apt-get install wget
    wget -qO- https://deb.nodesource.com/setup_14.x | sudo bash -
    sudo apt-get install -y nodejs

**On CentOS / Fedora**:

.. code-block:: bash

    sudo yum install -y gcc-c++ make
    curl -sL https://rpm.nodesource.com/setup_14.x | sudo -E bash -
    sudo yum install nodejs

Then use the newly installed Node Package Manager (npm) to install all javascript dependencies. When you execute this command, it reads from the file ``package.json`` which specifies all dependencies, their versions, and some additional node related configurations:

.. code-block:: bash

    sudo npm install
>>>>>>> 90292f85e2407831fae354933c29c2084ca2ac2a
