.. _styleguide:

Style Guide
===========

Javascript Style Guide
~~~~~~~~~~~~~~~~~~~~~~
This section outlines the Javascript style guide for developing with Semester.ly

Python Style Guide
~~~~~~~~~~~~~~~~~~

1. We follow the pycodestyle style guide for Python, with the exception that the
max-line-length is 88 instead of 79. This is to comply with the default settings of the
autoformatter black.

2. Use snake_case for variable names and functions. Use PascalCase for classes. Use
f-strings over ``%s`` strings or ``.format()``

3. Use type annotations when the type of a variable is ambiguous. When working with
other libraries, use type hints when possible.

4. Helper functions go *after* the function they appear in. Do not put them before the
method as is commonly done in languages like C.