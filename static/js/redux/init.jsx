import 'babel-polyfill';
import React from 'react';
import { render } from 'react-dom';
import { applyMiddleware, createStore } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { Provider } from 'react-redux';
import rootReducer from './reducers/root_reducer';
import SemesterlyContainer from './ui/containers/semesterly_container';
import { fetchMostClassmatesCount } from './actions/user_actions';
import { loadCachedTimetable, loadTimetable } from './actions/timetable_actions';
import { fetchSchoolInfo } from './actions/school_actions';
import { currSem } from './reducers/semester_reducer';
import {
    browserSupportsLocalStorage,
    setFriendsCookie,
    timeLapsedGreaterThan,
} from './util';
import * as ActionTypes from './constants/actionTypes';

export const store = createStore(rootReducer,
    window.devToolsExtension && window.devToolsExtension(),
    applyMiddleware(thunkMiddleware),
);

// get functions used to get backend endpoints
export const getSchool = () => store.getState().school.school;
export const getSemester = () => {
  const state = store.getState();
  const currSemester = currSem(state.semester);
  return `${currSemester.name}/${currSemester.year}`;
};

// setup the state. loads the currentUser's timetables if logged in; cached timetable if not.
// also handles sharing courses and sharing timetables
function setup(dispatch) {
  // TODO: pass as initData, use as state instead of globals
  school = JSON.parse(school);
  currentUser = JSON.parse(currentUser);
  currentSemester = JSON.parse(currentSemester);
  allSemesters = JSON.parse(allSemesters);
  uses12HrTime = JSON.parse(uses12HrTime);
  studentIntegrations = JSON.parse(studentIntegrations);
  featureFlow = JSON.parse(featureFlow);

  // TODO: use as state in feature flow reducer
  enableNotifs = enableNotifs === 'True';
  gcalCallback = gcalCallback === 'True';

  // setup initial redux state
  dispatch({
    type: ActionTypes.SET_SCHOOL,
    school, // comes from timetable.html
  });

  dispatch({
    type: ActionTypes.SET_SEMESTER,
    semester: parseInt(currentSemester, 10),
  });

  dispatch({
    type: ActionTypes.SET_AVAIL_SEMESTERS,
    availSemesters: allSemesters,
  });

  dispatch({
    type: ActionTypes.SET_USES12HRTIME,
    uses12HrTime,
  });

  // we load currentUser's timetable (or cached timetable) only if
  // they're _not_ trying to load a shared timetable
  if ($.isEmptyObject(featureFlow) || featureFlow.name !== 'SHARED_TIMETABLE') {
    // currentUser is logged in and has saved timetables load one of the currentUser's saved
    // timetables (after initial page load). also fetches classmates
    if (currentUser.isLoggedIn && currentUser.timetables.length > 0) {
      dispatch(loadTimetable(currentUser.timetables[0]));
      dispatch({ type: ActionTypes.RECEIVE_TIMETABLE_SAVED, upToDate: true });
      setTimeout(() => {
        dispatch(fetchMostClassmatesCount(currentUser.timetables[0].courses.map(c => c.id)));
      }, 500);
      dispatch({ type: ActionTypes.CACHED_TT_LOADED });
    } else if (browserSupportsLocalStorage()
            && (localStorage.semester === currentSemester ||
      ($.isEmptyObject(featureFlow) || featureFlow.name !== 'SHARED COURSE'))) {
    // currentUser isn't logged in (or has no saved timetables)
    // we only load the browser-cached timetable if the shared course's semester is
    // the same as the browser-cached timetable's semester OR the user is not trying to load a
    // shared course at all. This results in problematic edge cases, such as showing the course
    // modal of an S course in the F semester, being completely avoided.
      dispatch(loadCachedTimetable(allSemesters));
    }
  }

  // check if showed friends alert in the last 3 days
  if (browserSupportsLocalStorage() && 'serviceWorker' in navigator) {
    if (localStorage.getItem('friendsCookie') === null) {
      const time = new Date();
      setFriendsCookie(time.getTime());
      dispatch({ type: ActionTypes.ALERT_FACEBOOK_FRIENDS });
    } else if (timeLapsedGreaterThan(localStorage.getItem('friendsCookie'), 3) === true) {
            // if visit is more than 3 days of last friend alert
      const time = new Date();
      setFriendsCookie(time.getTime());
      dispatch({ type: ActionTypes.ALERT_FACEBOOK_FRIENDS });
    }
  }

  sharedTimetable = JSON.parse(sharedTimetable);
  sharedCourse = JSON.parse(sharedCourse);
  finalExamsSupportedSemesters = JSON.parse(finalExamsSupportedSemesters); // sidebar (display)
  findFriends = findFriends === 'True';
  enableNotifs = enableNotifs === 'True'; // user settings modal (classname)
  studentIntegrations = JSON.parse(studentIntegrations); // search bar (display)
  signup = signup === 'True';
  userAcq = userAcq === 'True';
  gcalCallback = gcalCallback === 'True'; // used for feature but also user settings modal
  exportCalendar = exportCalendar === 'True';
  viewTextbooks = viewTextbooks === 'True';
  finalExams = finalExams === 'True';
  //
  // const user = JSON.parse(currentUser); // currentUser comes from timetable.html
  // dispatch(getUserInfo(user));
  //
  // if (signup) {
  //   dispatch({ type: ActionTypes.TRIGGER_SIGNUP_MODAL });
  // }
  // if (userAcq) {
  //   dispatch({ type: ActionTypes.TRIGGER_ACQUISITION_MODAL });
  // }
  // if (gcalCallback) {
  //   dispatch({ type: ActionTypes.TRIGGER_SAVE_CALENDAR_MODAL });
  //   dispatch(addTTtoGCal());
  // }
  // if (exportCalendar) {
  //   dispatch({ type: ActionTypes.TRIGGER_SAVE_CALENDAR_MODAL });
  // }
  //   /* first setup the user's state */
  //
  // if (!sharedTimetable) {
  //
  // } else {
  //   dispatch({ type: ActionTypes.CACHED_TT_LOADED });
  // }
  //
  // if (gcalCallback) {
  //   dispatch({ type: ActionTypes.TRIGGER_SAVE_CALENDAR_MODAL });
  //   dispatch(addTTtoGCal());
  // }
  // if (viewTextbooks) {
  //   dispatch({ type: ActionTypes.TRIGGER_TEXTBOOK_MODAL });
  // }
  //   // check if registered for chrome notifications
  // dispatch(isRegistered());
  //   // check if first visit
  // if (browserSupportsLocalStorage() && 'serviceWorker' in navigator) {
  //   if (localStorage.getItem('firstVisit') === null) {
  //     const time = new Date();
  //     setFirstVisit(time.getTime());
  //   } else if (localStorage.getItem('declinedNotifications') === null) { // if second visit
  //     if (timeLapsedGreaterThan(localStorage.getItem('firstVisit'), 1) === true) {
  //               // if second visit is one day after first visit
  //               // deploy up-sell pop for chrome notifications
  //       dispatch({ type: ActionTypes.ALERT_ENABLE_NOTIFICATIONS });
  //     }
  //   } else { // if after second visit
  //     if (localStorage.getItem('declinedNotifications') === true
  //               || localStorage.getItem('declinedNotifications') === false) {
  //               // do nothing : either accpeted or declined notigications
  //     }
  //     if (timeLapsedGreaterThan(localStorage.getItem('declinedNotifications'), 3) === true) {
  //               // deploy up-sell pop for chrome notifications
  //       dispatch({ type: ActionTypes.ALERT_ENABLE_NOTIFICATIONS });
  //     }
  //   }
  // }
  //
  //   /* now setup sharing state */
  // if (sharedTimetable) {
  //   dispatch(lockTimetable(sharedTimetable, true, user.isLoggedIn));
  // } else if (sharedCourse) {
  //   dispatch(setCourseInfo(sharedCourse));
  //   dispatch(fetchCourseClassmates(sharedCourse.id));
  // } else if (findFriends) {
  //   dispatch({ type: ActionTypes.TOGGLE_PEER_MODAL });
  // }
  // if (enableNotifs) {
  //   if (!user.isLoggedIn) {
  //     dispatch({ type: ActionTypes.TRIGGER_SIGNUP_MODAL });
  //   } else {
  //     dispatch({
  //       type: ActionTypes.OVERRIDE_SETTINGS_SHOW,
  //       data: true,
  //     });
  //   }
  // }
  // if (finalExams) {
  //   dispatch({ type: ActionTypes.SHOW_FINAL_EXAMS_MODAL });
  // }
}

setup(store.dispatch);

// asynchronously get the school's specific info, including departments,
// areas, etc
store.dispatch(
    fetchSchoolInfo(),
);

render(
  <Provider store={store}>
    <SemesterlyContainer />
  </Provider>, document.getElementById('page'));
