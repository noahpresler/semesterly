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

Init.jsx
~~~~~~~~
This file is responsible for the initialization of the application. It creates a Redux store from the root reducer, then takes care of all initialization. Only in ``init.jsx`` do we reference JSON passed from the backend via ``timetable.html``. 

It is this JSON, called ``initData`` which we read into state as our initial state for the redux application. However, sometimes there are special `flows` that a user could follow that might change the initial state of the application at page load. For this we use flows which are documented more thoroughly at the following link: :ref:`flows`.

Other actions required for page initialization are also dispatched from ``init.jsx`` including those which load cached timetables from the browser, alerts that show on page load, the loading of user's timetables if logged in, and the triggering of the user agreement modal when appropriate. 

Finally, ``init.jsx`` renders ``<SemesterlyContainer />`` to the DOM. This is the root of the application.

Actions
~~~~~~~~

The actions directory follows this structure::

    static/js/redux/actions
    ├── calendar_actions.jsx ── exporting the calendar (ical, google)
    ├── exam_actions.jsx ── final exam scheduling/sharing
    ├── modal_actions.jsx ── openning/closing/manipulating all modals
    ├── school_actions.jsx ── getting school info
    ├── search_actions.jsx ── search/adv search 
    ├── timetable_actions.jsx ── fetching/loading/manipulating timetables
    └── user_actions.jsx ── user settings/friends/logged in functionality

Reducers
~~~~~~~~

The reducers directory follows this structure::

    static/js/redux/reducers
    ├── alerts_reducer.jsx ── visibility of alerts
    ├── calendar_reducer.jsx
    ├── classmates_reducer.jsx
    ├── course_info_reducer.jsx
    ├── course_sections_reducer.jsx
    ├── custom_slots_reducer.jsx
    ├── exploration_modal_reducer.jsx
    ├── final_exams_modal_reducer.jsx
    ├── friends_reducer.jsx
    ├── integration_modal_reducer.jsx
    ├── integrations_reducer.jsx
    ├── notification_token_reducer.jsx
    ├── optional_courses_reducer.jsx
    ├── peer_modal_reducer.jsx
    ├── preference_modal_reducer.jsx
    ├── preferences_reducer.jsx
    ├── root_reducer.jsx
    ├── save_calendar_modal_reducer.jsx
    ├── saving_timetable_reducer.jsx
    ├── school_reducer.jsx
    ├── search_results_reducer.jsx
    ├── semester_reducer.jsx
    ├── signup_modal_reducer.jsx
    ├── terms_of_service_banner_reducer.jsx
    ├── terms_of_service_modal_reducer.jsx
    ├── timetables_reducer.jsx
    ├── ui_reducer.jsx
    ├── user_acquisition_modal_reducer.jsx
    └── user_info_reducer.jsx


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
|``calendar.tsx``               | .. image:: components/calendar.png               |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``calendar.tsx``               | .. image:: components/calendar.png               |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``course_modal_section.jsx``   | .. image:: components/course_modal_section.png   |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``credit_ticker.jsx``          | .. image:: components/credit_ticker.png          |                          |
+-------------------------------+--------------------------------------------------+--------------------------+
|``custom_slot.tsx``            | .. image:: components/custom_slot.png            |                          |
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
