.. _flows:


*******************
Flows Documentation
*******************

Initalization
-------------

When a user loads the home timetable page, ``FeatureFlowView`` inside of
``timetable.utils`` is used to handle the request. On initial page load,
the frontend requires some data to initialize the redux state, like
information about the current user, the list of possible semesters for the
school, and the list of student integrations. This initial data is created
inside of the view, and passed in as a single json string in the response
context:

    .. code-block:: python

        class FeatureFlowView(ValidateSubdomainMixin, APIView):

            def get(self, request, *args, **kwargs):
                # ...gather values for init_data

                init_data = {
                    'school': self.school,
                    'currentUser': get_user_dict(self.school, self.student, sem),
                    'currentSemester': curr_sem_index,
                    'allSemesters': all_semesters,
                    'uses12HrTime': self.school in AM_PM_SCHOOLS,
                    'studentIntegrations': integrations,
                    'examSupportedSemesters': map(all_semesters.index,
                                                  final_exams_available.get(self.school, [])),

                    'featureFlow': dict(feature_flow, name=self.feature_name)
                }

                return render(request, 'timetable.html', {'init_data': json.dumps(init_data)})


which makes the ``init_data`` variable accessible in `timetable.html`. This dumped json string is
then passed to the frontend as a global variable:

    .. code-block:: html

          <script type="text/javascript">
            var initData = "{{init_data|escapejs}}";
          </script>

And then parsed inside of the ``setup()`` function in ``init.jsx``

    .. code-block:: javascript

        const setup = () => (dispatch) => {
            initData = JSON.parse(initData);

            // pass init data into the redux state
            dispatch({ type: ActionTypes.INIT_STATE, data: initData });

            // do other logic with initData...
        };

In other words, the data that the frontend requires is retrieved/calculated inside
of ``FeatureFlowView``, and then passed to the frontend as global variable ``initData``. The frontend
then does any logic it needs based on that data inside of ``setup()`` in ``init.jsx``. Any
data that needs to be reused later on from ``initData`` should be passed in to the redux state so
that the only global variable uses appear in ``setup()``.

Feature Flows
-------------

One such piece of data that is passed to the frontend is a ``featureFlow`` object. This object is
obtained as the return value of ``.get_feature_flow()``, in addition to a ``name: self.feature_name``
key value pair. In the default implementation, this is just the dictionary ``{name: None}``:

    .. code-block:: python

        class FeatureFlowView(ValidateSubdomainMixin, APIView):
            feature_name = None

            def get_feature_flow(self, request, *args, **kwargs):
                return {}

            def get(self, request, *args, **kwargs):
                ...
                feature_flow = self.get_feature_flow(request, *args, **kwargs)
                init_data = {
                    ...
                    'featureFlow': dict(feature_flow, name=self.feature_name)
                }

                return render(request, 'timetable.html', {'init_data': json.dumps(init_data)})

This feature flow value can be used to store any extra information that the frontend needs for any
endpoints that would require initial data to be loaded. For example, when loading a timetable share
link, the frontend also needs to get data about the timetable that is being shared - instead of making
a request to the backend after page load, this information can be provided by the backend directly
by passing this information in the feature flow. It is easy to write new views that pass different
data and have custom logic by subclassing ``FeatureFlowView`` and overwriting the
``get_feature_flow()`` method and the ``.feature_name`` class attribute.

Having this data all stored under the key
``featureFlow`` in ``init_data`` ensures two things. Firstly, it makes explicit that there can only
be one feature flow in play at a time (we can't load a timetable share link and a course share link
at the same time), and secondly, it allows the frontend to know where to look for any feature data
and act accordingly. In practice, this is done by switching on the name of the feature flow:

    .. code-block:: javascript

        const setup = () => (dispatch) => {
            initData = JSON.parse(initData);

            dispatch({ type: ActionTypes.INIT_STATE, data: initData });

            // do other logic with initData...

            dispatch(handleFlows(initData.featureFlow));
        };

        const handleFlows = featureFlow => (dispatch) => {
            switch (featureFlow.name) {
                case 'SIGNUP':
                    dispatch({ type: ActionTypes.TRIGGER_SIGNUP_MODAL });
                    break;
                case 'USER_ACQ':
                    dispatch({ type: ActionTypes.TRIGGER_ACQUISITION_MODAL });
                    break;
                case 'SHARE_TIMETABLE':
                    dispatch({ type: ActionTypes.CACHED_TT_LOADED });
                    dispatch(lockTimetable(featureFlow.sharedTimetable, true, initData.currentUser.isLoggedIn));
                    break;
                // ... etc.
                default:
                    // unexpected feature name
                    break;
          }
        };

Example
-------

To help understand how feature flows work, let's go through the code for an example feature flow:
course sharing. In order to implement course sharing, we want to create a new view/endpoint that
retrieves course data based on the url and passes it to the frontend, which would then update the
redux state and dispatch an action to open the course modal.

We start be defining a new endpoint for this feature flow:

    .. code-block:: python

        url(r'course/(?P<code>.+?)/(?P<sem_name>.+?)/(?P<year>.+?)/*$',
                           courses.views.CourseModal.as_view())

Then we create a new ``FeatureFlowView`` for this endpoint which needs to do two things: define
a name for the feature flow, which the frontend look at to determine what action to do, and return
the course data that the frontend needs inside of ``get_feature_flow()``:

    .. code-block:: python

        class CourseModal(FeatureFlowView):
            feature_name = "SHARE_COURSE"

            def get_feature_flow(self, request, code, sem_name, year):
                semester, _ = Semester.objects.get_or_create(name=sem_name, year=year)
                code = code.upper()
                course = get_object_or_404(Course, school=self.school, code=code)
                course_json = get_detailed_course_json(self.school, course, semester, self.student)

                # analytics
                SharedCourseView.objects.create(
                    student=self.student,
                    shared_course=course,
                ).save()

                return {'sharedCourse': course_json, 'semester': semester}

The frontend can now add a new case in ``handleFlows`` to perform logic for this feature flow:

    .. code-block:: javascript

        const handleFlows = featureFlow => (dispatch) => {
            switch (featureFlow.name) {
                ...
                case 'SHARE_COURSE':
                    dispatch(setCourseInfo(featureFlow.sharedCourse));
                    dispatch(fetchCourseClassmates(featureFlow.sharedCourse.id));
                    break;
                // ... etc.
                default:
                    // unexpected feature name
                    break;
          }
        };

Shortcuts
---------

Some feature flows don't require any extra data - they simply require the frontend to know that
a feature flow is being run. For example, for the signup feature flow, loading the page at
``/signup`` should simply open the signup modal, which requires no extra logic or data other than
knowing that it should occur. We could do this by writing a new view:

    .. code-block:: python

        class SignupModal(FeatureFlowView):
            feature_name = "SIGNUP"

We do not need to implement ``.get_feature_flow()`` since the frontend doesn't require any extra
data and the default implementation already returns an empty dictionary. We can simplify this
by simply declaring this view directly inside of the urls file:

    .. code-block:: python

        url(r'^signup/*$/', FeatureFlowView.as_view(feature_name='SIGNUP')


see https://github.com/noahpresler/semesterly/pull/838 for the 
original pull request implementing feature flows
