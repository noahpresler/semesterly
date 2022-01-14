.. _howitworks:

How it All Works
================
*A high level description of how Semester.ly works, and which parts do what*

Semester.ly pulls data about courses, exams, ratings, and more from all across the internet. It saves this data into a custom representation within a **Postgres database**. The data is retrieved using a variety of **webscraping, HTML parsing, and information retrieval** techniques which we've built into our own mini-library of utilities. This data is entered into the database via the **Django** ORM (Object-Relational Mapping). The ORM allows us to query the database and create rows using python code as if these rows were objects.

We manipulate and access this same data using Django **views** to respond to any web requests directed to our server. For example, when a user clicks on a course to open the course modal, the browser issues a request asking for the data related to that course. Our Django views respond with a **JSON** representation of the course data for rendering on the UI.

The browser knows when and how to make these requests, as well as how to generate the UI based on the responses using React and Redux. **React and Redux** maintain application state and use **Javascript** to render **HTML** based on that state.

Finally, this HTML is styled with **SCSS** for an appealing, cohesively styled user experience!

The Apps that Make Semester.ly
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
The overall, the Semester.ly application is made up of many smaller *apps* which each handle some collection of logic that makes Semester.ly tick! Each app encapsulates a set of urls which map a request to a view, views which respond to requests with HTML/JSON/etc, models which represent tables in the database, and tests which ensure Functionality behaves as expected.

.. list-table::
    :widths: 1 2 3
    :header-rows: 1

    * - App Name
      - Key Models/Functionality 
      - Description
    * - Semesterly
      - Root app. No core models, views, or functionality.
      - Delegates urls to sub-apps, contains end-to-end tests, other configuration.
    * - Timetable
      - **Models:** Course, Section, Offering, Timetable, Textbook, Evaluations 
      - Timetable generation and all models required for timetable representation.
    * - Courses
      - Course Serializer, Views for returning course info
      - Functionality for accessing course data, the course modal, course pages
    * - Authpipe
      - Authentication, login, signup
      - Authentication pipeline functions for the authentication of users, creation of students, and loading of social data via  `Python Social Auth <https://github.com/omab/python-social-auth>`_
    * - Analytics
      - **Models:** SharedTimetable, DeviceCookie, Feature Views
      - Tracks analytics on the usage of features as objects in the database. Renders a dashboard at /analytics.
    * - Exams
      - Final exam share model, views for serving final exam schedule
      - Contains the logic for inferring exam schedules from course schedules
    * - Integrations
      - Integration views
      - Functionality for integrating school specific code to appear in search or in the course modal
    * - Searches
      - Advanced search, basic search
      - Views for parsing queries and returning course data
    * - Students
      - Student, Personal Timetables, Reactions, Personal Event
      - All logic for logged-in specific users. Creating and saving a personal timetable, reacting to courses, saving custom events.
    * - Parsing
      - Scrapers, parsers, parsing utilities
      - Home of the data pipeline that fills our database