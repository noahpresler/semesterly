Editing This Documentation
==========================

Building the Docs
~~~~~~~~~~~~~~~~~

From the `docs` directory, execute the following command to rebuild all edited pages::

    make html

To rebuild all pages, you may want to do a clean build::

    make clean && make html

Viewing the Docs Locally
~~~~~~~~~~~~~~~~~~~~~~~~

From the docs directory, open the index file from the build directory with the command::

    open _build/html/index.html

Editing the Docs
~~~~~~~~~~~~~~~~~
All Django modules are documented via `Sphinx AutoDoc <http://www.sphinx-doc.org/en/stable/ext/autodoc.html>`_. To edit this documentation, update the docstrings on the relevant functions/classes.

To update the handwritten docs, edit the relevant `.rst` files which are included by filename from `index.rst`. 

.. note:: Be sure no warnings or errors are printed as output during the build process. Travis will build these docs and the build will fail on error.