.. _addaschool:

Add a School
************

Adding a new school is easy and can be done in a few simple steps:

    1. `Run the Scaffolder`_
    2. `Develop the Parser`_
    3. `Parse and Test`_

Run the Scaffolder
~~~~~~~~~~~~~~~~~~
Running the *makeschool* command will create a directory for your school, creating a configuration file, a stub for the parser, etc. Run the following for your school::

    python manage.py makeschool --name "University of Toronto" --code "uoft" --regex "([A-Z]{2,8}\\s\\d{3})"

Don't forget to add this new school to your /etc/hosts! (Check here for a reminder on how: :ref:`environment`)

Develop the Parser
~~~~~~~~~~~~~~~~~~

.. note:: Notify us if you intend to add a school! Create a GitHub issue with the tag new_school. We can help you out and lend a hand while also keeping track of who's working on what!

The scaffolder created the stub of your parser. It provides the start function and two outer loops that iterate over each provided term and year. **Your goal is to fill the inside of this so that for each year and term, you collect the course data for that term/year.**

What this boils down to is the following template::

    for year in years:
        for term in terms:

            departments = get_departments(term, year)

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
                        self.ingestor['year'] = ...
                        self.ingestor['term'] = ...
                        ...
                        self.ingestor.ingest_section()

                        for meeting in meetings:
                            ...
                            self.ingestor.ingest_meeting()

Breaking it down
################

    The code starts out by getting the departments. It doesn't have to, but often it is easiest to go department by department. The parser then collects the courses for that department. We will talk about how it does this in `How To Fill The Ingestor`_.

    For each course, the parser fills the ingestor with the fields related to the course (e.g. description, the course code). Once complete, it calls `ingest_course` to execute the creation of the course.

    It then repeats this process for the sections belonging to that course, and for each section, the meetings (individual meeting times) belonging to the section.

    Everything else is handled by the BaseParser and the ingestor for you.

How To Fill The Ingestor
########################
As shown by the code sample above, filling the ingestor is as easy as filling a python dictionary. The only question that remains is how to collect the data to fill it with.

The answer is by pulling it from the internet of course! Luckily we have a tool called the **Requester** which helps developers like you to *request* information from a web course catalogue or API.

Using the Requester
###################
By inheriting from the BaseParser, your parser comes with its own requester that can be used like this::

    markup = self.requester.get('www.siteorapi.com')

or::

    markup = self.requester.post('www.siteorapi.com', data=form)

It will automatically return a marked-up version of the data returned by the request (automatically detecting JSON/XML/HTML).

.. note:: The requester will maintain a `session <http://docs.python-requests.org/en/master/user/advanced/>`_ for you, making sure the proper cookies are stored and sent with all future requests. It also `randomizes the user agent <https://pypi.python.org/pypi/fake-useragent>`_. Future updates will automatically parallelize and throttle requests (*a great project to contribute to the data pipeline*).

Parsing JSON
#############
In the event that your source of course data returns JSON, life is easy. You can find the fields and pull them out by simply treating the JSON as a python dictionary when the requester returns it.

Parsing HTML (or XML)
#####################
If, instead, your site is marked up with HTML, we use `BeautifulSoup4 (BS4) <https://www.crummy.com/software/BeautifulSoup/bs4/doc/>`_ to find certain divs and map the data inside of those divs to the fields of the ingestor.

Let's say the HTML looks like this::

    <body>
        <div class="course-wrapper">
            <h1>EN.600.123</h1>
            <h4>Some Course Name</h4>
            <a href="urltosectiondata">More Info</a>
            ....
        </div>
        <div class="course-wrapper">
            ...
        </div>
        ...
    </body>

We can then write the get courses function as follows::

    def get_courses(self, department):
        soup = self.requester.get('urltothisdepartment.com')
        return soup.find_all(class_='course-wrapper')

And we can fill the ingestor based on these courses by::

    courses = self.get_courses(department)
    for course in courses:
        self.ingestor['course_code'] = course.find('h4').get_text()
        ...

To get section data, we can follow the "More Info" link and parse the resulting HTML in the same way::

    section_html = self.requester.get(course.find('a')['href'])

.. note:: You can learn more about BS4 by `reading their documentation <https://www.crummy.com/software/BeautifulSoup/bs4/doc/>`_ . It is an extensive library that provides many excellent utilities for parsing HTML/XML.

Parse and Test
~~~~~~~~~~~~~~
When you're ready you can go ahead and run your parser. You can do this by::

    python manage.py ingest [SCHOOL_CODE]

Replacing SCHOOL_CODE with whatever your school's code (e.g. jhu) is. This will start the ingestion process, creating a file `data/courses.json` in your school's directory.

If, along the way, your ingestion fails to validate, the ingestor will throw useful errors to let you know how or why!

Once it runs to completion, you can *digest* the JSON, entering it into the database by running::

    python manage.py digest [SCHOOL_CODE]

.. note:: To learn more, checkout the :ref:`pipeline`
