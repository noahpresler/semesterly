.. _frontend:

**********************
Frontend Documentation
**********************

The Structure
=============

.. note:: to understand the file structure, it is best to complete the following tutorial: `EggHead Redux <https://egghead.io/courses/getting-started-with-redux>`_. We follow the same structure and conventions which are typical of React/Redux applications.

Our React/Redux frontend can be found in ``static/js/redux`` and has the following structure::

    static/js/redux
    ├── __fixtures__
    ├── __test_utils__
    ├── __tests__
    ├── actions
    ├── constants
    ├── helpers
    ├── init.jsx
    ├── reducers
    ├── ui
    └── util.jsx

Let's break down this file structure a bit by exploring what lives in each section. 

    ``__fixtures__``:  JSON fixtures used as props to components during tests.

    ``__test_utils__``: mocks and other utilities helpful for testing.

    ``__tests__``: unit tests, snapshot tests, all frontend driven tests.

    ``actions``: all Redux/Thunk actions dispatched by various components. More info on this (more info on this below: `Actions`_)

    ``constants``: application-wide constant variables

    ``init.jsx``: handles application initialization. Handles flows (see :ref:`flows`), the passing of initial data to the frontend, and on page load methods.

    ``reducers``: Redux state reducers. (To understand what part of state each reducer handles, see `Reducers`_).

    ``ui``: all components and containers. (For more info see `What Components Live Where`_).

    ``util.jsx``: utility functions useful to the entire application.

Actions
~~~~~~~~

Reducers
~~~~~~~~

Init.jsx
~~~~~~~~
Mention flows

What Components Live Where
===========================

All of the components live under the ``/ui`` directory which follow the following structure:: 

    static/js/redux/ui
    ├── alerts
    │   └── ...    
    ├── containers
    │   └── ...
    ├── modals
    │   └── ...
    └── ...

General components live directly under ``/ui/`` and their containers live under ``/ui/contaners``. However alerts (those little popups that show up in the top right of the app), live under ``/ui/alerts``, and all modals live under ``/ui/modals``. Their containers live under their respective sub-directories.


Modals
~~~~~~~
+-------------------------------+--------------------------------------------------+--------------------------+
| Component File                | Screenshot                                       | Description              |
+===============================+==================================================+==========================+
|``course_modal_body.jsx``      | .. image:: components/course_modal_body.png      |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``course_modal.jsx``           | .. image:: components/course_modal.png           |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``exploration_modal.jsx``      | .. image:: components/exploration_modal.png      |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``final_exams_modal.jsx``      | .. image:: components/final_exams_modal.png      |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``peer_modal.jsx``             | .. image:: components/peer_modal.png             |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``preference_modal.jsx``       | .. image:: components/preference_modal.png       |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``save_calendar_modal.jsx``    | .. image:: components/save_calendar_modal.png    |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``signup_modal.jsx``           | .. image:: components/signup_modal.png           |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``textbook_modal.jsx``         | .. image:: components/textbook_modal.png         |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``tut_modal.jsx``              | .. image:: components/tut_modal.png              |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``user_acquisition_modal.jsx`` | .. image:: components/user_acquisition_modal.png |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``user_settings_modal.jsx``    | .. image:: components/user_settings_modal.png    |                          |
+-------------------------------+--------------------------------------------------+--------------------------+

General Components
~~~~~~~~~~~~~~~~~~
+-------------------------------+--------------------------------------------------+--------------------------+
| Component File                | Screenshot                                       | Description              |
+===============================+==================================================+==========================+
|``alert.jsx``                  | .. image:: components/alert.png                  |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``calendar.jsx``               | .. image:: components/calendar.png               |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``calendar.jsx``               | .. image:: components/calendar.png               |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``course_modal_section.jsx``   | .. image:: components/course_modal_section.png   |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``credit_ticker.jsx``          | .. image:: components/credit_ticker.png          |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``custom_slot.jsx``            | .. image:: components/custom_slot.png            |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``day_calendar.jsx``           | .. image:: components/day_calendar.png           |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``evaluation_list.jsx``        | .. image:: components/evaluation_list.png        |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``evaluation.jsx``             | .. image:: components/evaluation.png             |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``master_slot.jsx``            | .. image:: components/master_slot.png            |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``pagination.jsx``             | .. image:: components/pagination.png             |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``reaction.jsx``               | .. image:: components/reaction.png               |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``search_bar.jsx``             | .. image:: components/search_bar.png             |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``search_result.jsx``          | .. image:: components/search_result.png          |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``search_side_bar.jsx``        | .. image:: components/search_side_bar.png        |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``semesterly.jsx``             | .. image:: components/semesterly.png             |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``side_bar.jsx``               | .. image:: components/side_bar.png               |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``side_scroller.jsx``          | .. image:: components/side_scroller.png          |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``slot_hover_tip.jsx``         | .. image:: components/slot_hover_tip.png         |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``slot_manager.jsx``           | .. image:: components/slot_manager.png           |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``slot.jsx``                   | .. image:: components/slot.png                   |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``social_profile.jsx``         | .. image:: components/social_profile.png         |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``sort_menu.jsx``              | .. image:: components/sort_menu.png              |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``terms_of_service_banner.jsx``| .. image:: components/terms_of_service_banner.png|                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``terms_of_service_modal.jsx`` | .. image:: components/terms_of_service_modal.png |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
| ``timetable_loader.jsx``      | .. image:: components/timetable_loader.png       |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
| ``timetable_name_input.jsx``  | .. image:: components/timetable_name_input.png   |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
| ``top_bar.jsx``               | .. image:: components/top_bar.png                |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
