.. _parsing:


***************
Parsing
***************

Introduction
------------
In general, parsers are used to parse three types of info: course info,
course eval info, and textbook info, and parsing functionality is split into
different files based on these types of info

Writing Parsers
---------------
Parsers will be interfaced through the all_parser module, which
programmatically runs the desired parser by looking up the right function to import and run in the school_mappers module. 
In order for all components to link up properly, the process should be as follows:

1. Decide on a code name for your school. Should be short and unique
2. create a new folder in scripts with the name of that school
3. inside the folder, there need to be at least 4 files: __init__.py, 
   schoolname_courses.py, schoolname_evals.py, and schoolname_textbooks.py.
   These can be empty but they must exist
4. Implement your parser in the relevant file. There must be some function which
   when run, performs all the parsing. This function should have a non generic 
   name (not something like parse()), since all parser functions get imported
   into the same namespace.
5. Update the dictionaries in school_mappers.py with your new parsers. Each
   dict should map the chosen code name to the function mentioned in 4. If 
   a given file/parser has not yet been implemented, this can just be a dummy
   function.

Usage
-----
For convenience, a specific parser can be run through all_parser by calling::
  >>> python -m scripts.all_parser schoolcode
from the project root directory.
The new parser will now automatically be run with all the other parsers when
calling all_parser without any arguments.
