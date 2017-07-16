.. _setup:

Installation
============

This guide will bring you through the steps of creating a local Semester.ly server and development environment. It will walk through the setup of the core ecosystems we work within: Django/Python and React/Node/JS. It will additionally require the setup of a PostgreSQL database.

Fork/Clone The Repository
~~~~~~~~~~~~~~~~~~~~~~~~~
Forking Semester.ly will create your own version of Semester.ly listed on your GitHub! 
Cloning your Semester.ly fork will create a directory with all of the code required to run your own local development server. Navigate to the directory you wish to work from, then execute: 

1. **Fork** navigate to our `GitHub repository <https://github.com/noahpresler/semesterly>`_ then, in the top-right corner of the page, click Fork.

2. **Clone** by executing this line on the command line:

    .. note:: **ATTENTION:** Be sure to replace [YOUR-USERNAME] with your own git username 

    .. code-block:: bash

         git clone https://github.com/[YOUR-USERNAME]/semesterly


Setup a Python Virtual Enviroment
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Make sure you have installed Python 2.7. If you have not you can `follow this guide <https://wiki.python.org/moin/BeginnersGuide/Download>`_. Please also download the python installer, `PIP (install guide) <https://pip.pypa.io/en/stable/installing/>`_. We will now install and setup a python virtual environment. This keeps your dependencies for other projects and classes seperate from those required for Semester.ly.

Install virtualenv: 

.. code-block:: bash

    sudo pip install virtualenv

Create a virtual environment called ``venv``:

.. code-block:: bash

    virtualenv -p /usr/bin/python2.7 venv

To enter your virtual environment at anytime, execute the following code from your Semesterly directory just execute: 

.. code-block:: bash

    source venv/bin/activate

.. note:: Be sure to execute the above "source" command anytime you are working on Semesterly!


Install PostgreSQL
~~~~~~~~~~~~~~~~~~
Before installing the python requirements, you must make sure to have PostgreSQL setup on your device. 

**On mac**, `install Homebrew <http://brew.sh/>`_ and run: 

.. code-block:: bash

    brew install postgres
    pg_ctl -D /usr/local/var/postgres start && brew services start postgresql

**On Ubuntu** use apt:

.. code-block:: bash

    sudo apt-get install postgresql

Install Python Requirements
~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. note:: **ATTENTION MAC USERS:**, you must install the xcode command line tools via ``xcode-select --install`` before proceeding. You may also need to update openssl. If so, please `follow this guide <https://medium.com/@katopz/how-to-upgrade-openssl-8d005554401>`_. 

All python dependencies are kept in a file called ``requirements.txt``. Anytime a dependency is added or changed, we update it in this file. To bring your virutal environment up to date with all of these requirements easily, simply execute:

.. code-block:: bash

    pip install -r requirements.txt

Install Node Packages
~~~~~~~~~~~~~~~~~~~~~~
Node and node package manager are the backbone of our frontend setup. To begin, install Node Package Manager (npm). 

**On mac**:

.. code-block:: bash

    brew install node

**On Ubuntu**:

.. code-block:: bash

    sudo apt-get install nodejs
    sudo apt-get install npm

Then use the newly installed Node Package Manager (npm) to install all javascript dependencies. When you execute this command, it reads from the file ``package.json`` which specifies all dependencies, their versions, and some additional node related configurations:

.. code-block:: bash

    sudo npm install