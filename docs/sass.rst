***********************
HTML/SASS Documentation
***********************

.. note:: We write in SCSS syntax and not SASS.  SCSS is technically the newer version of SASS, `you can read about it here briefly here. <https://stackoverflow.com/questions/5654447/whats-the-difference-between-scss-and-sass/>`_ But SCSS and SASS are both compiled by the SASS precompiler.  We use SASSLint and SASSLoader to check our codestyle and work with Webpack since SCSSLint is written for ruby projects.  With all the confusion surrounding CSS, not sure why the tools that make CSS better also have to be confusing.

.. note:: From now on, I will refer to us as writing SCSS not SASS.

What's in SCSS, What's not?
~~~~~~~~~~~~~~~~~~~~~~~~~~~

Written in SCSS:

    1. Web Application

Written in plain CSS:

    1. Splash pages
    2. Pages for SEO
    3. Emails and unsubscribe pages
    4. basically everything that is not the web app

File Structure
~~~~~~~~~~~~~~

All of our SCSS is in ``static/css/timetable`` and is broken down into 5 folders.  The ``main.scss`` ties all the other SCSS files together importing them in the correct order.

========== =====================================================================
Folder     Use
========== =====================================================================
Base       ``colors.scss`` and ``fonts.scss``
Vendors    any scss that came from a package that we wanted to customize heavily
Framework  ``grid.scss`` and ``page_layout.scss``
Modules    styles for modular parts of our UI
Partials   component specific styles
========== =====================================================================

All of the other CSS files in the ``static/css`` folder is either used for various purposes outlined above.

SASSLint
~~~~~~~~

We use SASSLint with Airbnb's ``.scss-lint.yml`` file converted into ``.sass-lint.yml``.  Some things to take note of are

    1. All colors must be declared as variables in ``colors.scss``.  Try your best to use the existing colors in that file
    2. Double quotes
    3. Keep nesting below 3 levels, use BEM
    4. Use shortened property values when possible, i.e. ``margin: 0 3px`` instead of ``margin: 0 3px 0 3px``
    5. If a property is ``0`` don't specify units

Refer to our ``.sass-lint.yml`` for more details and if you're using intelliJ or some IDE, use the sass-lint module to highlight code-style errors/warnings as you code.

