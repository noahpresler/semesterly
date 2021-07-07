.. _parsing:

Loading the Database
********************

To load the database you must ingest (create the course JSON), validate (make sure the data makes sense), and digest (load the JSON into the database). You can do so using the following commands:

Ingest
######

.. note:: If you have ingested before and still have the JSON file on your device, you may skip ingesting and simply digest the old data. This is useful if you are resetting your database during development and wish to quickly reload course data.

.. code-block:: bash

    python manage.py ingest [SCHOOLCODE]

You may leave out the school code to parse all schools. This will run for a substantial amount of time and is not recommended.

.. note:: To parse JHU data, you will need to acquire an API access key from `SIS <sis.jhu.edu/api>`_. Add the key to ``dev_credentials.py`` in the ``semesterly/`` directory. Also, note that the [SCHOOLCODE] is ``jhu``.

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

For example, you can use the term and year flags to parse only a specific term

.. code-block:: bash

    python manage.py ingest [SCHOOLCODE] --term Fall --year 2021

If you are developing a parser or contributing to the pipeline design, you will more than likely need to learn more. Checkout :ref:`pipeline` or :ref:`addaschool`
