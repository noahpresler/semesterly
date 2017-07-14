.. _addaschool:

Add a School
*************

Adding a new school is easy and can be done in a few simple steps:

    1. `Run the Scaffolder`_
    2. `Develop the Parser`_
    3. `Test and Merge`_

Run the Scaffolder
~~~~~~~~~~~~~~~~~~
Running the *makeschool* command will create a directory for your school, creating a configuration file, a stub for the parser, etc. Run the following for your school::

    python manage.py makeschool --name "University of Toronto" --code "uoft" --regex "([A-Z]{2,8}\\s\\d{3})"

Don't forget to add this new school to your /etc/hosts! (Check here for a reminder on how: :ref:`environment`)

Develop the Parser
~~~~~~~~~~~~~~~~~~

.. note:: If your school uses one of the systems: Ellucian or Peoplesoft, you may be able to use our generalized infrastructure built to parse these systems with very minimal configuration. Before starting, check :ref:`genparsers`.

The scaffolder created the stub of your parser. It provides the start function and two outer loops that iterate over each provided term and year. **Your goal is to fill the inside of this so that for each year and term, you collect the course data for that term/year.**

What this boils down to is the following template::
    
    for year in years:
        for term in terms:

            departments = get_courses(term, year)

            for department in departments:

                courses = get_courses(department)

                for course in courses:
                    self.ingestor['course_code'] = ...
                    self.ingestor['department'] = ...
                    self.ingestor['description'] = ...
                    ...
                    self.ingestor.ingest_course()

                    for section in sections:
                        self.ingestor['section_code'] = ...
                        self.ingestor['section_type'] = ...
                        self.ingestor['semester'] = ...
                        ...
                        self.ingestor.ingest_section()
            
                        for meeting in meetings:
                            ...
                            self.ingestor.ingest_meeting()

Breaking it down
################

    The code starts out by getting the departments. It doesn't have too, but often its easiest to go department by department. The parser then collects the courses for that department. We will talk about how it does this later in `How To Fill The Ingestor`_.
    
    For each course, the parser then fills the ingestor with the fields related to the course (e.g. description, the course code). Once complete, it calls `ingest_course` to execute the creation of the course. 

    It then repeats this process for the sections belonging to that course, and for each section, the meetings (individual meeting times) belonging to the section.

    Everything else is handled by the BaseParser and the ingestor.

How To Fill The Ingestor
########################

Test and Merge
~~~~~~~~~~~~~~~~
