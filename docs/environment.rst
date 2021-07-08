.. _environment:

Setup Your Dev Environment
==========================

Now that all of the requirements are installed, it's time to get your environment up and running.

Setup Your Database
~~~~~~~~~~~~~~~~~~~

Semester.ly stores objects like courses, timetables, and students in a Postgres database. Let's get a database setup for you.

Let's first initialize Postgres using the default user account ``postgres``

.. note:: If using Linux, log into this account with

    .. code-block:: bash

        sudo -i -u postgres

Then, enter Postgres environment with

.. code-block:: bash

    psql postgres

.. note:: If you see an error in CentOS / Fedora, it's most likely because postgres is not running. Initialize it with ``sudo service postgresql initdb && sudo service postgresql start``.

Here you can enter SQL to create/manipulate/access databases. Let's create a Semester.ly database. Enter:

.. code-block:: psql

    CREATE DATABASE semesterly;

Then, create a database user, set ``myusername`` and ``mypassword`` to whatever you wish

.. code-block:: psql 

    CREATE USER myusername WITH PASSWORD 'mypassword';

Finally, grant all access to the created database to your new user, ``myusername``:

.. code-block:: psql

    GRANT ALL PRIVILEGES ON DATABASE semesterly TO myusername;

Great. You are all set. Enter the following to quit psql:

.. code-block:: psql
    
    \q

.. note:: If using Linux, exit postgres by 

    .. code-block:: bash

        exit

.. note:: For CentOS / Fedora, Change all occurances of ident to md5 in pg_hba.conf. You can modify the file through ``sudo vim /var/lib/pgsql9/data/pg_hba.conf``. After you change it, restart postgres with ``sudo service postgresql restart``.

Create Local Settings
~~~~~~~~~~~~~~~~~~~~~

Now that you have a database created, we need to inform Django of the configuration. Do so by creating a new file called ``local_settings.py`` and placing it in the ``semesterly/`` directory within your workspace. You should find that there is already a similar file called ``settings.py`` found in the same folder.

The contents of this file should be:

.. code-block:: python
    
    DEBUG = True

    TEMPLATE_DEBUG = DEBUG

    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql_psycopg2',
            'NAME': 'semesterly',
            'USER': 'myusername',
            'PASSWORD': 'mypassword',
            'HOST': 'localhost',
            'PORT': '5432',
        }
    }

.. note:: Be sure to change the values of ``myusername`` and ``mypassword`` to the values you chose when creating your user!

Migrate Your Database
~~~~~~~~~~~~~~~~~~~~~

Now that Django knows about the database, it can conform the empty database to our schema. Simply execute:

.. code-block:: bash

    python manage.py migrate

Edit your /etc/hosts
~~~~~~~~~~~~~~~~~~~~
For development purposes, we map http://sem.ly:8000 to http://localhost:8000. To do this locally, execute the following line of bash:

.. code-block:: bash

    sudo sh -c "echo '127.0.0.1       sem.ly jhu.sem.ly uoft.sem.ly vandy.sem.ly chapman.sem.ly umich.sem.ly gw.sem.ly umd.sem.ly' >> /etc/hosts"

.. note:: If you add a school, be sure to add it to this file!


Set your Environment Type
~~~~~~~~~~~~~~~~~~~~~~~~~
Add the following line to either your ``~/.bashrc`` or ``~/.zshrc`` which tells webpack you are running a development environment:

.. code-block:: bash

    export NODE_ENV=development

Then ``source ~/.bashrc`` or ``source ~/.zshrc``

And make sure the following line returns "development"

.. code-block:: bash

    echo $NODE_ENV


Install & Run Webpack
~~~~~~~~~~~~~~~~~~~~~

Webpack compiles our React componenets into one application-wide javascript bundle. We use ChromeDriver for automated browser testing.

To install them:

.. code-block:: bash

    npm install -g webpack chromedriver
    

Then run it with:

.. code-block:: bash

    npm run watch

.. note:: Always leave ``npm run watch`` running. It will continuously watch your javascript files and recompile automatically after edits/changes.


Running the Server
~~~~~~~~~~~~~~~~~~

Now, the moment you've all been waiting for! Let's run the server! (Be sure to leave the last ``npm run watch`` command running)

.. code-block:: bash

    python manage.py runserver

Navigate to http://sem.ly:8000, and if everything loads, you should be all set :). You did it! 

Your Final Setup
~~~~~~~~~~~~~~~~
Great work. Your Semester.ly local environment is all setup.

Don't forget: **whenever you're working on Semester.ly** you should have one terminal running the server (via ``python manage.py runserver``), and one running webpack (via ``npm run watch``). 

.. note:: Don't forget to always work from your virtual environment! From the root directory, just execute ``source /venv/bin/activate`` to enter it. 

Happy hacking! To fill up your database, be sure to checkout :ref:`parsing`.
