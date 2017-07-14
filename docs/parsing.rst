.. _parsing:

Loading the Database
*********************

To load the database you must ingest (create the course JSON), and digest (enter the JSON into the database). You can do so using the following commands:

Ingest
######

.. note:: If you have ingested before and still have the JSON file on your device, you may skip ingesting and simply digest the old data. This is useful if you are resetting your database during development and wish to quickly reload course data.

.. code-block:: bash
    
    python manage.py ingest [SCHOOLCODE]

You may leave out the school code to parse all schools. This will run for a substantial amount of time.

Digest
######

.. code-block:: bash
    
    python manage.py digest [SCHOOLCODE]

You may leave out the school code to digest all schools.

Learn More & Advanced Usage
###########################

There are advanced methods for using these tools. For example, you can use the term and year flags to parse only a specific term::

    python manage.py ingest [SCHOOLCODE] --term Fall --year 2017

To learn more, checkout :ref:`pipeline` or :ref:`addaschool`