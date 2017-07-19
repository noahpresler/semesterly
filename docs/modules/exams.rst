Exams App
=============

The exams app provides minimal infrastructure for concluding exam periods based on a timetable. So far it only supports rule based scheduling meaning "If Monday 9-12, exam is 5/12 2-5pm" and is only used at Johns Hopkins. However, the infrastructure can be used for any school using a rule based approach.

Models
~~~~~~
.. automodule:: exams.models
    :members:

Views
~~~~~
.. automodule:: exams.views
    :members:


Final Exam Scheduler
~~~~~~~~~~~~~~~~~~~~~
.. automodule:: exams.final_exam_scheduler
    :members:

Example Implementation
######################
.. automodule:: exams.jhu_final_exam_scheduler
    :members:
