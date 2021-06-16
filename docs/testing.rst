How to Run & Write Tests
************************

Running Tests
=============

Frontend
--------

Run all tests::

    npm test

Run single test::

    npm test -- static/js/redux/__tests__/schema.test.js

Backend
-------

Run all tests::

    python manage.py test

Run all tests for a single app::
  
    python manage.py test timetable

Run single test suite::

    python manage.py test timetable.tests.UrlsTest

Run single test case::

    python manage.py test timetable.tests.UrlTest.test_urls_call_correct_views

Run tests without resetting db::

    python manage.py test -k

Our current test runner will only run db setup if the tests you're running
touch the db.

Writing Tests
=============

Unit Tests
----------

Contributors are encouraged to write unit tests for changed and new code.
By separating out logic into simple pure functions, you can isolate the
behavior you care about in your unit tests and not worry about testing
for side effects. Following the design principles outlined in the resources from
the :ref:`learning` section helps with this. For example, extracting all code 
that extract information from the state into selectors, which are pure functions
that take the state (or some part of it) as input and output some data, will
make it easy to test and change state-related behavior. 
Sometimes you may want to test behavior that can't be extracted into a pure
function or that touches external interfaces. There are a number of strategies
you can use in these cases.

Integration Tests
-----------------
In the frontend, for testing the logic for rendering a component, look into
snapshot tests. For testing async (thunk) action creators, our current tests
create a store with desired initial state, dispatch the action, and then check that the action
had the desired effect on the state. Backend requests are mocked using the nock
library.

For testing views, we use django's built-in client to send requests to the backend.
It's also possible to use django's request factory to create requests to provide
directly as input to your views. 

End to End Tests
----------------
As the name implies, end to end tests test the entire app at once by simulating
a semesterly user. When writing or changing end to end tests, it is recommended
to familiarize yourself with the methods provided in SeleniumTestCase, which
make it easy to perform certain actions on the app.
