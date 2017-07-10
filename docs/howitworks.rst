.. _howitworks:

How it All Works
================
*A high level description of how Semester.ly works, and what parts do what*

Semester.ly pulls data about courses, exams, ratings, and more from all across the internet. It saves this data into a custom representation within a **Postgres database**. The data is retrieved using a variety of **webscraping, HTML parsing, and information retrieval** techniques which we've built into our own mini-library of utilities. This data is entered into the database via the **Django** ORM (Object-Relational Mapping). The ORM allows us to query the database and create rows using python code as if these rows were objects.

We manipulate and access this same data using Django **views** to respond to any web requests directed to our server. For example, when a user clicks on a course to open the course modal, the browser issues a request asking for the data related to that course. Our Django views respond with a **JSON** representation of the course data for rendering on the UI.

The browser knows when and how to make these requests, as well as how to generate the UI based on the responses using React and Redux. **React and Redux** maintain application state and use **Javascript** to render **HTML** based on that state.

Finally, this HTML is styled with **SASS** for an appealing, cohesively styled user experience!

The Apps that Make Semester.ly
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
The overall, the Semester.ly application is made up of many smaller *apps* which each handle some collection of logic that makes Semester.ly tick! 

.. list-table::
    :widths: 2 1 1
    :header-rows: 1

    * - App Name
      - Key Models/Functionality 
      - Description
    * - Timetable
      - **Models:** Course, Section, Offering, Timetable, Textbook, Evaluations 
      - Timetable generation and all models required for timetable representation.
    * - Timetable
      - **Models:** Course, Section, Offering, Timetable, Textbook, Evaluations 
      - Timetable generation and all models required for timetable representation.