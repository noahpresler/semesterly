.. _flows:


*****
Flows
*****

A feature flow is extra code that is run on initial page load of the
homepage, specified by an endpoint. This code can involve launching a
feature, for example showing the exam modal at /final_exams, or can
be part of some other flow, like completing oauth for gmail. Writing
a flow consists of the following:

Urls (Backend)
--------------
Add a new endpoint for your flow that points to an instance of a
``FeatureFlow`` view.

Views (Backend)
---------------
``timetable.utils`` contains a ``FeatureFlow`` view which responds to
GET requests with initial state in addition to a ``featureFlow`` object
which should contain all the data the frontend needs to execute
a feature. One value of this object is filled in automatically:
``FeatureFlow`` will set the ``"name"`` key to ``self.feature_name``, and
the rest is given by the return value of ``self.get_feature_flow``.
This way, a flow view which does not need to provide additional data
(e.g. toggling the exam modal), can simply be specified as
``FeatureFlow.as_view(feature_name='exams')``, which defines a view
that responds with a ``featureFlow`` object of ``{'name': 'exams'}``

Init (Frontend)
---------------
``init.jsx`` loads the json data sent from the backend and saves it
as as ``initData``. To handle flow data sent from the backend, add a
case inside of the setup function based on ``featureFlow.name``.
Any data from ``initData`` that is used outside of init should be
a part of the redux state instead of invoked directly as a global
variable.

see https://github.com/noahpresler/semesterly/pull/838 for the 
original pull request implementing flows this way
