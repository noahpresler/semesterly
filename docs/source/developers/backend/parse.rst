Parsing
====================================

**Parsing** in this context is the process of gathering and transforming data made available by universities into the Semesterly system.

This process includes web retrieval and information extraction and formatting. Exploring concepts in Networks, Formal Languages, Databases, and good'ol hackery.

The exposed system has been designed to provide both useful utilities and recommended patterns, yet also allows a developer freedom of design.

Heretofore, all utilities can be assumed, unless explcitly stated, to be implemented in Python 2.7. 

.. note::

    I have a dream, that one day all will be implemented in Python 3.5. Why not start now?


School Directory
---------------------

Directory Structure
~~~~~~~~~~~~~~~~~~~~~~

The school directory structure is where your code and configuration files will live. 

.. literalinclude:: includes/dir_structure.txt
    :linenos:

The highest level directory is simply the *nickname* of the school. When giving a nickname to a school be sure to keep it short yet descriptive, following the `snake case <https://en.wikipedia.org/wiki/Snake_case>`_ naming convention if needed. This name is what will be used in the url seen by a user (i.e. `jhu.semester.ly <https://jhu.semester.ly>`_). It is often prudent to use a colloqualism, for example:

.. highlight:: none

::

    jhu     Johns Hopkins University
    vandy   Vanderbilt University
    umich   University of Michigan in Ann Arbor
    udub    University of Washington in Seattle

``__init__.py`` is simply a blank file needed in this directory for `Python to view this directory as containing packages <http://stackoverflow.com/questions/448271/what-is-init-py-for>`_. The other ``*.py`` files contain the code needed to parse; they will be discussed in detail later. ``misc/utils/`` is, by design, a bit more undefined and is a place where you, the developer, can place any extraneous code you need for the parse.

.. warning::

    ``misc/utils/`` introduces potential security risks.

.. todo::

    Do some analysis and set max size limit for directory and subdirectories

Config File
~~~~~~~~~~~~~~~~~~~~~~

The ``config.json`` is used in order for all components to link up properly on the front and backend.

.. literalinclude:: includes/config.json
   :language: json

.. todo::

    write about updated ``config.json`` format once I sleep on it.

The fields displayed above are required in the ``config.json`` and must obey various other requirements:
    
    :school_code: must match the directory name, discussed above. Must be unique, see :download:`list of used school codes <../school_codes.txt>`.
    :time_granularity: refers to the minimum increment of time (in minutes, multiple of 5) needed to encode all start and end times for courses.
    :textbooks: set to indicate whether this information is provided by your school/parser.
    :evals: set to indicate whether this information is provided by your school/parser.
    :time24: bool that refers to the hour format time display characteristic of a school.
    :live_data: bool to be set when the data being parsed is `regularly` updated with live information (e.g. enrollment or waitlist information).
    :course_code_regex: defines the regular expression that must describe all course codes seen within your school. Please be as specific as you can, while also gauranteeing correctness. The regex defined above was created to define course codes that include:

        - EN.600.420
        - AS.101.120

    :terms: is a list of all term names. Please use sensible names and good judgement but this is designed to be more flexible if needed.
    :registration_groupings: defines the registration grouping periods for the school in question. The values found within this list of lists **must** match and encompass the full set of terms defined by ``terms``.
    :campuses: is used to list distinct campuses within a university. These campuses should deleniate distinct course registration seperations. This field is not required.

.. seealso::

    ``config.json`` JSON schema defintion

Parsers 
~~~~~~~~

The parsers can be found in the directory ``parsers`` in files: 

    - ``courses.py``
    - ``textbooks.py``
    - ``evals.py``
    - ``instrs.py``
    - ``finals.py``

And json data outputs are written to the files in directory ``data``:

    - ``courses.json``
    - ``textbooks.json``
    - ``evals.json``
    - ``instrs.json``
    - ``finals.json``

The seperation of the parsers and data into categories is provided in order to handle the general case that the respective information is provided across various school resources. Ideally, the data and implementations for the above are modularized into these components, however, they can be combined in any configuration as needed; note, however, that only these files are allowed in these directories (extraneuous files can live in ``misc/utils/``. In addition, it is required to provide an implementation for ``courses.py`` and data in ``courses.json``, but it is not necessarily required to provide implmentations or data for the others filenames.

The implementation of each parser must inherit the abstract base class ``Parser``. The simplified representation of Parser class is shown below:

.. highlight:: python

::

    from abc import ABCMeta

    class Parser:
        __metaclass__ = ABCMeta

        @abstractmethod
        def parse(): pass

Since all parsers get imported into the same namespace, this ensures that the global namespace does not get polluted and that there is some sense of conformity between parsers.

.. todo::

    expand on these and show an example.

Output Format
--------------------

The output of each parser will be a JSON representation the follows defined structure. There are a few components used in the Semesterly framework. There is the

    1. ``course`` which describes a course as seperate from its actual setting and location. ``course`` s are local per school but are **not** local per term.
    2. ``section`` which describes a specific instance of a ``course``. Sections are local per per term.
    3. ``offering`` which are the individual times that are offered within a ``section``.
    4. ``textbook link`` which is a link between a textbook and a particular ``section``.
    5. ``evaluation`` which is an evaluation specific per ``section``.
    6. ``textbook`` information needed to render actual textbook. Textbooks are not local per term, nor local per school.

These JSON objects are modularized in such a way as to allow instances to be nested or listed side-by-side. We will go component by component explaining by example the fields and associated restrictions of each. At the end, we will put them all together. Note that **highlighted fields are required**. Setting a field equal to ``null`` is acceptable but it is treated as the equivalent of not defining the field.

.. todo::

    Talk about optimal format for speed.

.. note::

    Not all JSON properties are defined every time they are used, if they have already been described prior.

Course
~~~~~~~~

.. literalinclude:: includes/course.json
    :language: json
    :linenos:
    :emphasize-lines: 2,4-5,7-8

Explanation:

    :kind: indicates json object of kind ``course``
    :school_code: must match the school_code defined in ``config.json``.
    :course_code: must satisfy the course_code_regex defined in ``config.json``.
    :name: the name of the course
    :campus: is the campus that this particular course is offered on. Must be defined in ``config.json``.
    :credits: can be any single integer or float. Set to ``-1`` if variable or undefined credits.
    :department: Optional forms:

        1) a dictionary that contains the department code and name. If in this form, both fields are required.

        2) may also be a string.

    :description: the description of the course. Optional forms:

        1) A list of relevant descriptions of a course. In this form, this field can easily display cases of different parts of the description (e.g. description, info, notes). 

        2) The field can also just be a string.

    :prerequisites: list of prerequisites for this course. Entries should preferably match the course code regex, but that is not required.
    :corequisites: list of corequisites for this course. Entries should preferably match the course code regex, but that is not required
    :exclusions: list of exclusions for this course. Entries should preferably match the course code regex, but that is not required.
    :areas: a list of strings. Use at own discretion.
    :levels: a list or single string describing the level of the course. Use at own discretion.
    :cores: a list of core requirements satisfied by the course. Use at own discretion.
    :geneds: a list of general education fulfillments.
    :homepage: a valid url for the course.
    :related: a list of valid course codes. This will be used in our recommendation engine.

Section
~~~~~~~~
.. literalinclude:: includes/section.json
    :language: json
    :linenos:
    :emphasize-lines: 2,4-6,14

Explanation:

    :section_code: the identifier of a section.
    :term: must match a term defined in ``config.json``.
    :year: the year that the section is offered. Must be in ``YYYY`` format.
    :capacity: the max seats available in a section.
    :enrollment: the current number of students enrolled in a section.
    :waitlist: the number of students on the waitlist.
    :waitlist_size: the max size of the waitlist.
    :remaining_seats: this will be automatically calculated if given -1 or left out.
    :type: could be `Lecture`, `Lab`, `Tutorial`, etc.. Defaults to `Lecture`.
    :fees: A float or string that will default to 0.00.
    :instructors:  a list of course instructors; the first in the list is the primary instructor. The entries in the list can take the form of
        
        1)  a dictionary

            :name: **required** if dictionary is defined.
            :title: title of instructor in question. If ``title`` is *Primary* overrides the primary set as first in list.
            :email: email of instructor. Must be valid email.
            :homepage: homepage of instructor. Must be valid url.

        2) A single string is also valid. In this case, special care will be taken for values of *TBD* and *NA*

    :final_exam: optional field to specify final exam information. If ``final_exam`` is defined, a ``date`` (below) must be defined as well.

        :date: the (valid) date of the final exam. *Format: DD/MM/YYYY*
        :time_start: 24hr time.
        :time_end: 24hr time, must follow ``time_start``.
        :campus: the campus of the final exam. Note, this campus **does not** have to be defined in ``config.json``, but it is prefered.
        :location: the building and room of the final exam.
        :notes: any notes pertaining to final exam.


Textbook Link
~~~~~~~~~~~~~~
A list of textbooks (links) associated with a given course section.

.. literalinclude:: includes/textbook_link.json
    :language: json
    :linenos:
    :emphasize-lines: 2-5

Explanation:

    :kind: indicates json object of kind ``textbook link``.
    :course_code: the course that the textbook link applies to. Must satisify the course_code_regex defined in ``config.json``, must have already been defined the in a ``course`` listing, or may be omitted if nested within ``course`` listing.
    :section: the section that the textbook link applies to. Must already have defined a valid ``course`` that has a ``section`` defined that matches. May be omitted if nested within ``section`` listing.
    :isbn: isbn of textbook to link to.
    :required: a bool indicating whether a textbook is required for a section or not. Defaults to true.


Offering
~~~~~~~~~

An offering 

.. literalinclude:: includes/offering.json
    :language: json
    :linenos:
    :emphasize-lines: 2-7

Explanation:

    :days: this is a list of valid days, :regexp:`[M|T|W|R|F|S|U]`. These days will be assumed to be repeated every week. In addition a valid date that satisfies the regex ``date regex`` and agrees with the term year provided in ``section``. Ex: ``"days": ["M", "10/02/16", "F"]``.
    :time_start: 24-hour time.
    :time_end: 24-hour time. Must be after time_start.
    :campus: the campus must be defined in ``config.json``.
    :location: the building and room of the offering.


Evaluation
~~~~~~~~~~~
.. literalinclude:: includes/eval.json
    :language: json
    :linenos:
    :emphasize-lines: 2-3

Explanation:

    :score: an integer or float score out of 5 (stars) for the course.
    :summary: the text of the evaluation.
    :instructor: list of instructors of a course. Elements of the list may be strings or a dictionary as defined in ``section``.
    :term_year: the term and year the evaluation pertains to.

Textbook
~~~~~~~~~
This should be handled in our amazon textbook library methods. **Leaving out discussion for now**.

.. literalinclude:: includes/textbook.json
    :language: json
    :linenos:
    :emphasize-lines: 2-3

Explanation:

    :kind: indicates json object of kind ``textbook``.


Nesting and Omissions
~~~~~~~~~~~~~~~~~~~~~
The json objects defined above can handle reasonable nesting schemes. Furthermore, there often exists cases where nesting may allow (*but not enforce*) you to omit some fields from the json objects. The fields that can be omitted will usually be *obviously* redundant. For example, you can nest sections within a ``course`` object and omit the ``course_code`` field in the ``section`` object.

.. highlight:: none

::

    {
        "kind": "course",
        ...
        "sections": [
            {
                "kind": "section",
                ...
            },
            {
                "kind": "section",
                ...
            }
        ]

    }

Specific labels associated with the nesting - in the case above ``"sections"`` - are strictly defined below:

    =============   ============== ===== =============   =================
    kind            nesting label  type  parent          allowed omissions
    =============   ============== ===== =============   =================
    section         sections       []    course          kind, course_code
    offering        offerings      []    section         kind, course_code, section_name
    offering        offerings      []    course          kind, course_code
    textbook_link   textbook_links []    course          kind, course_code, section_name
    eval            evals          []    course          kind, course_code
    textbook        textbook       {}    textbook_link   kind
    =============   ============== ===== =============   =================

Note that though a field may be omitted, as per the rules above, **if defined**, the field **must satisfy** all requirements set in its basis definition. Furthermore, if not omitted, a nesting label **must** agree with the ``kind`` defined.


Final Thoughts
~~~~~~~~~~~~~~~
The output format was designed in such a way to allow for maximum freedom. Our goal was to create a format that allowed for us to deleniate between information uniformly while not enforcing undo overhead on a developer. For example, it is not best practice to cache data in order to conform to the order of the json object format, therefore, reasonable (optional) nesting is allowed. Furthermore, most fields are optional with defaults being handled in the backend.

Utilities
----------------------
The design parsing framework is developed 

Requester
~~~~~~~~~~~~~~~~~~~~
HTTP requests and BS4 parsing.

Scraper
~~~~~~~~~~~~~~~~~~~~
Scrape data from website.

Extractor
~~~~~~~~~~~~~~~~~~~~
Extract information from scraped data.

Ingestor
~~~~~~~~~~~~~~~~~~~~
Helpers to convert information to json.

Digestor
~~~~~~~~~~~~~~~~~~~~
Validation. Load json into models.

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
