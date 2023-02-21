.. _parsing:

Loading the Database
********************

To load the database you must ingest (create the course JSON), validate (make sure the data makes sense), and digest (load the JSON into the database). You can do so using the following commands:

.. tip::

    You will often have to run commands within the Docker containers. To access
    containers, open the Docker explorer on the left pane. There should be three
    containers named ``jhuopensource/semesterly``, ``semesterly``, and
    ``postgres:12.1``. Right clicking any of these should give you the option ``Attach
    Shell``, which will open a terminal into the corresponding container. For this
    section, attach the shell to the ``semesterly`` container.

Ingest
######

.. note:: To parse JHU data, you will need to acquire an API access key from `SIS <https://sis.jhu.edu/api>`_. Add the key to ``dev_credentials.py`` in the ``semesterly/`` directory. Also, note that the [SCHOOLCODE] is ``jhu``.

.. code-block:: bash

    python manage.py ingest [SCHOOLCODE] --years [YEARS] --terms [TERMS]

For example, use ``python manage.py ingest jhu --years 2023 --terms Spring`` to parse
Spring 2022 courses. You may also leave out the school code to parse all schools. This
will run for a substantial amount of time and is not recommended.

.. note:: If you have ingested before and still have the JSON file on your device, you may skip ingesting and simply digest the old data. This is useful if you are resetting your database during development and wish to quickly reload course data.

Digest
######

.. code-block:: bash

    python manage.py digest [SCHOOLCODE]

You may leave out the school code to digest all schools.


Learn More & Advanced Usage
###########################

There are advanced methods for using these tools. Detailed options can be viewed by running

.. code-block:: bash

	python manage.py [command] --help


If you are developing a parser or contributing to the pipeline design, you will more than likely need to learn more. Checkout :ref:`pipeline` or :ref:`addaschool`

.. tip::

    You may need to run Postgres commands beyond what running queries through the
    Postgres extension is capable of. In this case, attach a shell to the postgres
    container and run ``psql -U postgres``. You should now be in the postgres shell. You
    can use ``\q`` to leave it.
