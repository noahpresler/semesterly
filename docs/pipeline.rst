.. _pipeline:

***************************
Data Pipeline Documentation
***************************

Semester.ly's data pipeline provides the infrastructure by which the database is filled with course information. Whether a given University offers an API or an online course catalogue, this pipeline lends developers an easy framework to work within to pull that information and save it in our Django Model format.

General System Workflow
~~~~~~~~~~~~~~~~~~~~~~~
    1. Pull HTML/JSON markup from a catalogue/API
    2. Map the fields of the mark up to the fields of our ingestor (by simply filling a python dictionary).
    3. The ingestor preprocesses the data, validates it, and writes it to JSON.
    4. Load the JSON into the database.

.. note:: This process happens automatically via `Django/Celery Beat Periodict Tasks <https://github.com/celery/django-celery-beat>`_. You can learn more about these schedule tasks below (`Scheduled Tasks`_).

Steps 1 and 2 are what we call **parsing** – an operation that is non-generalizable across all Universities. Often a new parser must be written. For more information on this, read :ref:`addaschool`.

Parsing Library Documentation
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Base Parser
-----------
.. automodule:: parsing.library.base_parser
	:members:
	:undoc-members:
	:inherited-members:
	:show-inheritance:

Requester
---------
.. automodule:: parsing.library.requester
	:members:
	:undoc-members:
	:inherited-members:
	:show-inheritance:

Ingestor
--------
.. automodule:: parsing.library.ingestor
	:members:
	:undoc-members:
	:inherited-members:
	:show-inheritance:

Validator
---------
.. automodule:: parsing.library.validator
	:members:
	:undoc-members:
	:inherited-members:
	:show-inheritance:

Logger
------
.. automodule:: parsing.library.logger
	:members:
	:undoc-members:
	:inherited-members:
	:show-inheritance:


Tracker
-------
.. automodule:: parsing.library.tracker
	:members:
	:undoc-members:
	:inherited-members:
	:show-inheritance:

Viewer
------
.. automodule:: parsing.library.viewer
	:members:
	:undoc-members:
	:inherited-members:
	:show-inheritance:


Digestor
--------
.. automodule:: parsing.library.digestor
	:members:
	:undoc-members:
	:inherited-members:
	:show-inheritance:

Exceptions
----------
.. automodule:: parsing.library.exceptions
	:members:
	:undoc-members:
	:inherited-members:
	:show-inheritance:

Extractor
---------
.. automodule:: parsing.library.extractor
	:members:
	:undoc-members:
	:inherited-members:
	:show-inheritance:

Utils
-----
.. automodule:: parsing.library.utils
	:members:
	:undoc-members:
	:inherited-members:
	:show-inheritance:



Parsing Models Documentation
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
.. automodule:: parsing.models
	:members:

Scheduled Tasks
~~~~~~~~~~~~~~~
.. automodule:: parsing.tasks
    :members:
    :undoc-members:
    :inherited-members:
    :show-inheritance: