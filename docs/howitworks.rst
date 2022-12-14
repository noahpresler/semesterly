.. _howitworks:

High Level Design
=================
*A high level description of what Semester.ly is, how it works, and which parts do what*

Problem
~~~~~~~
Course registration is a complicated process involving several factors that influence
which courses a student decides to take, such as degree requirements, professor and
course ratings, friends, and personal interests. Trying to keep track of potential
schedules a student can take can easily become overwhelming.

Solution
~~~~~~~~
Semester.ly aims to make course registration easy and collaborative through a user
interface that focuses on student needs, providing quick access to necessary tools a
student may need in order to organize and decide on what courses they want to take.

Current Features
~~~~~~~~~~~~~~~~

Search
^^^^^^
.. image:: search_labels.png

By typing in a query in the search field at the top of the site, students can quickly
search for courses that they are looking for.

A. Clicking on the course search result will reveal more information about the course
   (see below).

B. [Deprecated] This button will add the course to your optional courses, meaning
   Semester.ly will try to fit the course into your schedule if there's space for it.

C. Add course to schedule.

D. Hovering over these course sections will preview what your schedule looks if you were
   to add the course.

.. image:: course_modal.png

*Example of course information, which includes how many credits the course is, a brief
description, [deprecated] course evaluations, sections, and students' reactions*

There is also an option for Advanced Search, allowing for filtering of
department, area, course level, and day/time.

.. image:: advanced_search.png

The courses you add to your schedule will show up in a color-coded display to allow you
to easily distinguish between courses and when they take place.

.. image::example_schedule.png

Scheduling
^^^^^^^^^^
.. image:: general_labels.png

A. Rotate through potential schedules based on differing sections

B. Switch the semester from, e.g. Fall 2022 to Spring 2022

C. Open the Advanced Search

D. Add current courses to SIS cart; requires JHU Login

E. Add a custom event; this is to add, e.g. an extracurricular to the schedule, or any
   other activity that is not a course.

F. Generate a share link to share the schedule with other students

G. Create a new schedule

H. Export the calendar to a .ics file

I. Preferences menu, e.g. toggle on/off weekends

J. Change schedule name

K. Select another schedule (of the same semester) to switch to it.

L. (Behind the dropdown) Find New Friends displays other students who are also taking
   your classes.

M. Compares two schedules together, showing same and differing courses

N. Opens various account settings

O. Duplicate schedule

P. Delete schedule

Screenshots
^^^^^^^^^^^
.. image :: compare_timetables.png

An example of what it looks like to compare two schedules.

Features in Development
~~~~~~~~~~~~~~~~~~~~~~~

0. Enhancing Search - display more than 4 results and scroll infinitely when searching
   for courses regularly

1. Dark Mode - option to toggle between light and dark mode

2. Study Groups - option to message students who are also taking your class to ask if
   they want to study together or go to class together

Tech Stack
~~~~~~~~~~
Semester.ly pulls data about courses, ratings, and more from all across the internet. It saves this data into a custom representation within a **Postgres database**. The data is retrieved using a variety of **webscraping, HTML parsing, and information retrieval** techniques which we've built into our own mini-library of utilities. This data is entered into the database via the **Django** ORM (Object-Relational Mapping). The ORM allows us to query the database and create rows using python code as if these rows were objects.

We manipulate and access this same data using Django **views** to respond to any web requests directed to our server. For example, when a user clicks on a course to open the course modal, the browser issues a request asking for the data related to that course. Our Django views respond with a **JSON** representation of the course data for rendering on the UI.

The browser knows when and how to make these requests, as well as how to generate the UI based on the responses using React and Redux. **React and Redux** maintain application state and use **Javascript/Typescript** to render **HTML** based on that state.

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
    * - Agreement
      - Terms of Service and Privacy Policy views
      - Tracks changes to terms of service and privacy policy.
    * - Analytics
      - **Models:** SharedTimetable, DeviceCookie, Feature Views
      - Tracks analytics on the usage of features as objects in the database. Renders a dashboard at ``/analytics``.
    * - Authpipe
      - Authentication, login, signup
      - Authentication pipeline functions for the authentication of users, creation of students, and loading of social data.
    * - Courses
      - Course Serializer, Views for returning course info
      - Functionality for accessing course data, the course modal, course pages
    * - Parsing
      - Scrapers, parsers, parsing utilities
      - Home of the data pipeline that fills our database
    * - Searches
      - Advanced search, basic search
      - Views for parsing queries and returning course data
    * - Semesterly
      - No core models, views, or functionality; contains Django settings.
      - Delegates urls to sub-apps, contains end-to-end tests, other configuration.
    * - Students
      - **Models:** Student, Personal Timetables, Reactions, Personal Event
      - All logic for logged-in specific users. Creating and saving a personal timetable, reacting to courses, saving custom events.
    * - Timetable
      - **Models:** Course, Section, Offering, Timetable, Semester, Evaluations 
      - Timetable generation and all models required for timetable representation.