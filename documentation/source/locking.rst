.. _locking:


**********************
Locking Implementation
**********************


Data Representation
-------------------

Locking courses involves mapping from a course (specifically, a course id),
to a map from a section type (e.g. tutorial, lecture, etc. Any group of sections
which will reference the same locked section) to the locked section in question
(specifically, that section's code). 

For example, say we have a course calculus
with id 100, and lectures 'L1', 'L2', and tutorials 'T1' and 'T2'. Then one
way to specify locked courses would be: {100: {'L': 'L2', 'T': 'T1'}}, which
says that course 100 has L2 locked for section type L and T1 locked for section
type T.

Implementation
--------------
This is implemented as the "course_to_section" variable in update_timetable.js.
The issue is that when an action occurs on a front end which involves locking,
the front end has no way of knowing what the section type of the locked item
is - this is stored on the back end. Therefore the front end must send the
section id to the backend, separately from the courses_to_sections object,
(currently in the POST this is under updated_courses, which has a list of courses
and their locked sections, if any). The back end then looks up the section type,
updates the backend representation of the locked section (LOCKED_SECTIONS), and
then resends an updated courses_to_sections object to the front end.