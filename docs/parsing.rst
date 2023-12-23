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
Spring 2023 courses. You may also leave out the school code to parse all schools. This
will run for a substantial amount of time and is not recommended.

.. note:: If you have ingested before and still have the JSON file on your device, you may skip ingesting and simply digest the old data. This is useful if you are resetting your database during development and wish to quickly reload course data.

Digest
######

.. code-block:: bash

    python manage.py digest [SCHOOLCODE]

You may leave out the school code to digest all schools.


Loading Course Evaluations for JHU
**********************************

Loading JHU evaluations into Semester.ly requires two steps. First, run the selenium parser locally to crawl the evaluation HTML file and save it to a JSON file. 
Then, run the digest command to load the JSON file into the database. JHU publishes evaluations for the past 5 years, so the parser will crawl the evaluations for the past 5 years and save them to a JSON file.
However, to get the evaluations for the current semester, you will need to run the parser again in the current year after the evaluations are published at the end of the semester.

Instructions for Parsing Evaluations
####################################

**Prerequisites**

Ensure your computer is using an **x86-64 architecture** since the chrome driver is only compatible with this architecture.


1. **Install Chrome in Docker Environment**
From your web container shell, execute the following script:

.. code-block:: bash

    code/build/install_chrome.sh
    
2. **Set the Year Variable**
Modify the `year` variable in `parsing/library/evals_parser.py` to select the desired year for the evaluations.
Run the following command in the web container shell:

.. code-block:: bash
  
    python parsing/library/evals_parser.py
  
.. note::Enter your **JHU email and password** when prompted.

3. **Ingestion and Digestion to Local Database**
After the ingestion process completes, the file `parsing/schools/jhu/data/evals.json` will be generated.
To digest the evaluations into the local database, run:

.. code-block:: bash
  
    python manage.py digest jhu --types evals
  

Final Step for Production Database
####################################

After merging `evals.json` to production, the script `run_parser.sh` will handle the digestion of the evaluations into the production database.

Troubleshooting
###############

**Selenium or Chrome Driver Issues:** 
If you encounter any issues related to Selenium or the Chrome Driver, try running the following command in the web container shell:

.. code-block:: bash
  
    pip install -r requirements.txt
    
This command will install necessary dependencies that may resolve the issues

**JSON Output Generation Issues:** 
If you're facing difficulties with generating JSON output, consider executing the script locally rather than in a Docker environment.


Learn More & Advanced Usage
***************************

There are advanced methods for using these tools. Detailed options can be viewed by running

.. code-block:: bash

	python manage.py [command] --help


If you are developing a parser or contributing to the pipeline design, you will more than likely need to learn more. Checkout :ref:`pipeline` or :ref:`addaschool`

.. tip::

    You may need to run Postgres commands beyond what running queries through the
    Postgres extension is capable of. In this case, attach a shell to the postgres
    container and run ``psql -U postgres``. You should now be in the postgres shell. You
    can use ``\q`` to leave it.
