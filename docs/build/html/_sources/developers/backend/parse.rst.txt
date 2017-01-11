Parsing
====================================

**Parsing** in this context is the process of gathering and transforming data made available by universities into the Semesterly system.

This process includes web retrieval and information extraction and formatting. Exploring concepts in Networks, Formal Languages, Databases, and good'ol hackery.

The exposed system has been designed to provide both useful utilities and recommended patterns, yet also allows a developer freedom of design.

Heretofore, all utilities can be assumed, unless explcitly stated, to be implemented in Python 2.7. Note, however, that parsers can be designed in other languages (see ...).

School Directory
---------------------

Directory Structure
~~~~~~~~~~~~~~~~~~~~~~

The school directory structure is where your code and configuration files will live. 

.. highlight:: none
    :linenothreshold: 5

::

    | -- <school (nick)name>
        * ---- __init__.py
        * ---- config.json
        * ---- courses.py
        * ---- textbooks.py
        * ---- evals.py
        | ---- misc
            | -- utils/
        | ---- data
            * -- courses.json
            * -- textbooks.json
            * -- evals.json

.. school nickname:

The highest level directory is simply the nickname of the school. When giving a nickname to a school be sure to keep it short yet descriptive, following the `snake case <https://en.wikipedia.org/wiki/Snake_case>`_ naming convention if needed. This name is what will be used in the url seen by a user (i.e. `jhu.semester.ly <https://jhu.semester.ly>`_). It is often prudent to use a colloqualism, for example:

.. highlight:: none

::

    jhu     Johns Hopkins University
    vandy   Vanderbilt University
    umich   University of Michigan in Ann Arbor
    udub    University of Washington in Seattle

``__init__.py`` is simply a blank file needed in this directory for `Python to view this directory as containing packages <http://stackoverflow.com/questions/448271/what-is-init-py-for>`_. ``courses.py``, ``textbooks.py``, and ``evals.py`` all contain the code needed to parse; they will be discussed in detail later. ``misc/utils/`` is, by design, a bit more undefined and is a place where you, the developer, can place any extraneous code you need for the parse.


Config File
~~~~~~~~~~~~~~~~~~~~~~

The ``config.json`` is used in order for all components to link up properly on the front and backend.

.. literalinclude:: includes/config.json
   :language: json

The fields displayed above are required in the ``config.json`` and must obey various other requirements:
    
    1. The value for ``"code"`` must match the directory name, discussed above.
    2. ``"time_granularity"`` refers to the minimum increment of time (in minutes) needed to encode all start and end times for courses.
    3. ``"time24"`` refers to the hour format time display characteristic of a school and can take on one of two values, ``true`` or ``false``.
    4. ``"textbooks"`` and ``"evals"`` can be set accordingly to indicate whether this information is provided by your school/parser.
    5. The ``"course_code_regex"`` defines the regular expression that must describe all course codes seen within your school. Please be as specific as you can, while also gauranteeing correctness. The regex defined above was created to define course codes that include:

        - EN.600.420
        - AS.101.120
    6. ``"terms"`` is a list of all term names. Please use sensible names and good judgement but this is designed to be more flexible if needed.
    7. In addition to listing the terms, some schools offer their registration per term and others per school year. As such, ``"registration_groupings"`` defines the registration groupings for the school in question. The values found within this list of lists **must** match and encompass the full set of terms defined by ``"terms"``.
    8. ``campuses`` is used to list distinct campuses within a university. These campuses should deleniate distinct course registration seperations. This field is not required.
    9. ``"live_enrollment"`` should be set when the data being parsed is `regularly` updated with live information (e.g. enrollment or waitlist information).

Parsers 
~~~~~~~~

The parsers can be found in the files: 

    - ``courses.py``
    - ``textbooks.py``
    - ``evals.py``

The seperation of the parsers is provided in order to handle the general case that the respective information is provided across various school resources. Ideally, the implementations for the above are modularized into these three components, however, they can be combined in any configuration as needed, but the filenames must remain the same. In addition, it is not required to provide an implementation for ``textbooks.py`` or ``evals.py``, just be sure to indicate that in the ``config.json``.

The implementation of each parser must inherit the abstract base class ``Parser``. The simplified representation of Parser class is shown below:

.. highlight:: python

::

    from abc import ABCMeta

    class Parser:
        __metaclass__ = ABCMeta

        @abstractmethod
        def parse(): pass

Since all parsers get imported into the same namespace, this ensures that the global namespace does not get polluted and that there is some sense of conformity between parsers.

Output Format
--------------------

The output of each parser will be a json representation the follows the given structure. There are a few components used in the Semesterly framework. There is the

    1. ``course: which describes a course as seperate from its actual setting and location. ``course`` s are local per school but are **not** local per term.
    2. ``section`` which describes a specific instance of a ``course``. This is specific per term.
    3. ``offering`` which are the individual times that are offered within a ``section``.
    4. ``textbook`` which is a link to a textbook needed for a particular ``section``.
    5. ``evaluation`` which is an evaluation specific per ``section``.

We will go component by component explaining by example the fields and associated restrictions of each. At the end, we will put them all together. Note that **highlighted fields are required**.

Course
~~~~~~~~

.. literalinclude:: includes/course.json
    :language: json
    :linenos:
    :emphasize-lines: 2-9

Explanation:

    :school_code: must match the school_code defined in ``config.json``.
    :course_code: must satisfy the course_code_regex defined in ``config.json``.
    :credits: can be any single integer or float.
    :department: is a dictionary that contains the department code and name. One of these sub-fields (code and name) is required, but both are preferred.
    :description: can take one of two forms. It can be a list of relevant descriptions of a course. In this form, this field can easily display cases of different parts of the description (e.g. description, info, notes). The field can also just be a single string outside of a list.
    :campus: is the campus that this particular course is offered on.
    :requirements: consists of pre/corequisites, exclusions, and other. All but the last in that list must be lists, if included.
    :fulfill: seeks to identify more specific information about a course that may be more pertinent to some schools more than others.
    :related: this will be used in our recommendation engine.
    :homepage: a valid url, if provided, for the course.


Section
~~~~~~~~
.. literalinclude:: includes/section.json
    :language: json
    :linenos:
    :emphasize-lines: 2-8,11,12

Explanation:

    :course_code: must satisify the course_code_regex defined in ``config.json`` and must have already been defined the in a ``course`` listing.
    :section_name: the identifier of a section.
    :term: must match a term defined in ``config.json``.
    :capacity: the max seats available in a section.
    :enrollment: the current number of students enrolled in a section.
    :waitlist: the number of students on the waitlist.
    :waitlist_size: the max size of the waitlist.
    :remaining_seats: this will be automatically calculated if given -1 or left out.
    :type: could be `Lecture`, `Lab`, `Tutorial`, etc.
    :instructurs: a list of course instructors, the first in the list is the primary instructor.
    :fees: A float or string that will default to 0.00.

Offering
~~~~~~~~~

An offering 

.. literalinclude:: includes/offering.json
    :language: json
    :linenos:
    :emphasize-lines: 2-7

Explanation:

    :course_code: must satisify the course_code_regex defined in ``config.json`` and must have already been defined in a ``course`` listing.
    :section_name: must already have defined a valid ``course`` that has a ``section`` defined that matches.
    :days: this is a list of valid days, ``M, T, W, R, F, S, U``. These days will be assumed to be repeated every week. In addition a valid date that satisfies the regex ``date regex`` and agrees with the term year provided in ``section``. Ex: ``"days": ["M", "10/02/16", "F"]``.
    :time_start: 24-hour time.
    :time_end: 24-hour time. Must be after time_start.
    :location: this can take on one of two types.

        1) The dictionary shown above

            :campus: the campus must be defined in ``config.json``.
            :building: the building of the offering.
            :room: the room of the offering.

        2) A string ``"location": "Shaffer 300"``.


Textbook
~~~~~~~~~
.. literalinclude:: includes/textbook.json
    :language: json
    :linenos:

Evaluation
~~~~~~~~~~~
.. literalinclude:: includes/eval.json
    :language: json
    :linenos:

All
~~~~


Utilities
----------------------

Utilities
~~~~~~~~~~~~~~~~~~~~

Framework
----------------------
The design parsing framework is developed 

Requester
~~~~~~~~~~~~~~~~~~~~

Scraper
~~~~~~~~~~~~~~~~~~~~

Extractor
~~~~~~~~~~~~~~~~~~~~

Ingestor
~~~~~~~~~~~~~~~~~~~~

(Subscription) Handles
~~~~~~~~~~~~~~~~~~~~~~~





TRASH
-------

The design of the parsing infrastructure is developed in such a way as to allow the maximum amount of contribution and extensibility. In this light, the infrastructure does not enforce a language requirement on parsers. All that is required is a valid `shebang <https://en.wikipedia.org/wiki/Shebang_(Unix)>`_. Of course we must have the binaries to run your preferred language as well. We currently support:

    - Python 2 or 3
    - C/C++ (consider `scoping <http://stackoverflow.com/questions/21898770/file-scope-and-global-scope-c-c>`_)
    - Java
    - Rust
    - Ruby
    - Perl
    - Bash

and we have also included an optional `docker <https://www.docker.com/>`_ integration, talked about later (** TODO or not**). 

Note that, the frameworks and utilities provided are developed for Python 2.7.
