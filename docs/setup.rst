.. _setup:

Installation
=============

This guide will bring you through the steps of creating a local Semester.ly server and development environment. It will walk through the setup of the core ecosystems we work within: Django/Python and React/Node/JS. It will additionally require the setup of a PostgreSQL database.

Setting up Visual Studio Code
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
We recommend using `Visual Studio Code <https://code.visualstudio.com/>`_
(VSCode) for its integration with WSL 2, Docker, and the Postgres database. 
This section assumes you will be using Visual Studio Code for development with 
Semester.ly.

1. **If you are on Windows OS**, see the following guide on
`installing Windows Subsystem for Linux (WSL)
<https://docs.microsoft.com/en-us/windows/wsl/install-win10>`_. We recommend 
choosing Ubuntu 20.04 as your linux distribution. Make sure you take the extra
steps to enable WSL 2 as it will be required for Docker.

After WSL 2 is installed, install the `Remote - WSL extension by Microsoft 
<https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl>`_
in VSCode. This will allow you to open a VSCode window within your linux
subsystem. Press ``Ctrl+Shift+P`` and select the option ``Remote-WSL: New WSL 
Window``.

2. Install the `Docker extension by Microsoft 
<https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker>`_
and the `Postgres extension by Chris Kolkman 
<https://marketplace.visualstudio.com/items?itemName=ckolkman.vscode-postgres>`_.

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

4. Add this entry to your hosts file as follows (This file is in C:\\Windows\\System32\\drivers\\etc\\hosts or /etc/hosts)

    .. code-block:: bash

        127.0.0.1       sem.ly jhu.sem.ly

    .. note:: **ATTENTION:** If you're working on other schools, add their URLs here as well (i.e. uoft.sem.ly for University of Toronto).

5. Launch terminal or a command window and run:

    .. code-block:: bash

        docker-compose build
        docker-compose up

    The **build** command creates a local database and build of your source code.
    The **up** command runs everything. Be careful not to build when you don't need to as this will destroy your entire database and you'll need to ingest/digest again to get your course data (which takes about 30 minutes).

    .. note:: 
    
        If you run into additional errors, try the following:

            1. Change "buildkit" from ``true`` to ``false`` in ``Settings -> Docker 
            Engine``. 

            2. Refer to the `Docker troubleshooting document
            <https://github.com/microsoft/vscode-docker/wiki/Troubleshooting>`_

    Open a browser and visit http://jhu.sem.ly:8000 to verify you have
    Semester.ly running.

Setting up Postgres
~~~~~~~~~~~~~~~~~~~
You can easily access the Postgres database within VSCode by following the next
steps. You should have the `Postgres extension by Chris Kolkman
<https://marketplace.visualstudio.com/items?itemName=ckolkman.vscode-postgres>`_
installed.

1. Open the Postgres explorer on the left pane and click the plus button in the top right of the explorer to add a new database connection.

2. Enter ``127.0.0.1`` as the database connection.

3. Enter ``postgres`` as the user to authenticate as.

4. Enter nothing as the password of the PostgreSQL user.

5. Enter ``5432`` as the port number to connect to.

6. Select ``Standard Connection``.

7. Select ``postgres``.

8. Enter a display name for the database connection, such as ``semesterly``.

Upon expanding a few tabs under the new semesterly database, you should see
several tables. Right clicking any of these tables gives you options to select
(view) the items in the table or run a query.

If this is your first time running Semester.ly, you will want to populate your 
database with courses. Before you continue to :ref:`parsing`, please read the
following additional tips for working with Docker and Postgres.

Additional Tips
~~~~~~~~~~~~~~~
You will often have to run commands within the Docker containers. For
example, the next section requires you to run something similiar to ``python 
manage.py ingest jhu --term Fall --years 2021`` in the semesterly container. To
access containers, open the Docker explorer on the left pane. There should be
three containers named jhuopensource/semesterly, semesterly, and postgres:12.1.
Right clicking any of these should give you the option ``Attach Shell``, which
will open a terminal into the corresponding container.

You may also need to run Postgres commands beyond what running queries are
capable of. In this case, open a terminal in the postgres container and run
``psql -U postgres``. You should now be in the postgres shell.

If you ever need to hard reset Docker, use the command ``docker system prune
-a``. You can then follow up with ``docker-compose build`` and ``docker-compose
up``.

In order to log in on your local running version of Semester.ly, you will need
access to auth keys. Please ask one of the current developers for access to
these keys if you require use of login authentication for development. 
Furthermore, some logins require use of https, so ensure that you are on 
https://jhu.sem.ly instead of http://jhu.sem.ly:8000 in these cases.
