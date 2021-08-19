Student App
===========

The Student model is an abstraction over the Django user to provide us with a more full user profile including information pulled from social authentication via Google and/or Facebook (and/or Microsoft JHED at JHU). This app handles utilities for overriding the Python Social Auth authentication pipeline, while also handling the functionality for logged in users.

The student app also encapsulates all models tied directly to a user like PersonalTimetables, PersonalEvents, Reactions, and notification tokens.

Models
~~~~~~
.. automodule:: student.models
    :members:

Views
~~~~~
.. automodule:: student.views
    :members:

Utils
~~~~~
.. automodule:: student.utils
    :members:

Serializers
~~~~~~~~~~~
.. automodule:: student.serializers
    :members: