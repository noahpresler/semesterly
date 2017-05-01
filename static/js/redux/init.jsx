import 'babel-polyfill';
import React from 'react';
import { render } from 'react-dom';
import { applyMiddleware, createStore } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { Provider } from 'react-redux';
import rootReducer from './reducers/root_reducer';
import SemesterlyContainer from './ui/containers/semesterly_container';
import { fetchMostClassmatesCount, getUserInfo, isRegistered } from './actions/user_actions';
import { loadCachedTimetable, loadTimetable, lockTimetable } from './actions/timetable_actions';
import { fetchSchoolInfo } from './actions/school_actions';
import { currSem } from './reducers/semester_reducer';
import { fetchCourseClassmates, setCourseInfo } from './actions/modal_actions';
import {
    browserSupportsLocalStorage,
    setFirstVisit,
    setFriendsCookie,
    timeLapsedGreaterThan,
} from './util';
import { addTTtoGCal } from './actions/calendar_actions';
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
  finalExamsSupportedSemesters = JSON.parse(finalExamsSupportedSemesters); // sidebar (display)
  featureFlow = JSON.parse(featureFlow);

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

  dispatch(getUserInfo(currentUser));

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

      // check if registered for chrome notifications
  dispatch(isRegistered());
    // check if first visit
  if (browserSupportsLocalStorage() && 'serviceWorker' in navigator) {
    if (localStorage.getItem('firstVisit') === null) {
      const time = new Date();
      setFirstVisit(time.getTime());
    } else if (localStorage.getItem('declinedNotifications') === null) { // if second visit
      if (timeLapsedGreaterThan(localStorage.getItem('firstVisit'), 1) === true) {
                // if second visit is one day after first visit
                // deploy up-sell pop for chrome notifications
        dispatch({ type: ActionTypes.ALERT_ENABLE_NOTIFICATIONS });
      }
    } else { // if after second visit
      if (localStorage.getItem('declinedNotifications') === true
                || localStorage.getItem('declinedNotifications') === false) {
                // do nothing : either accpeted or declined notigications
      }
      if (timeLapsedGreaterThan(localStorage.getItem('declinedNotifications'), 3) === true) {
                // deploy up-sell pop for chrome notifications
        dispatch({ type: ActionTypes.ALERT_ENABLE_NOTIFICATIONS });
      }
    }
  }

  switch (featureFlow.name) {
    case 'SIGNUP':
      dispatch({ type: ActionTypes.TRIGGER_SIGNUP_MODAL });
      break;
    case 'USER_ACQ':
      dispatch({ type: ActionTypes.TRIGGER_ACQUISITION_MODAL });
      break;
    case 'GCAL_CALLBACK':
      // hide settings info modal until user is finished adding to gcal
      dispatch({ type: ActionTypes.OVERRIDE_SETTINGS_HIDE, data: true });
      dispatch({ type: ActionTypes.TRIGGER_SAVE_CALENDAR_MODAL });
      dispatch({ type: ActionTypes.OVERRIDE_SETTINGS_HIDE, data: false });
      dispatch(addTTtoGCal());
      break;
    case 'EXPORT_CALENDAR':
      dispatch({ type: ActionTypes.TRIGGER_SAVE_CALENDAR_MODAL });
      break;
    case 'SHARE_TIMETABLE':
      dispatch({ type: ActionTypes.CACHED_TT_LOADED });
      dispatch(lockTimetable(featureFlow.sharedTimetable, true, currentUser.isLoggedIn));
      break;
    case 'VIEW_TEXTBOOKS':
      dispatch({ type: ActionTypes.TRIGGER_TEXTBOOK_MODAL });
      break;
    case 'SHARE_COURSE':
      dispatch(setCourseInfo(featureFlow.sharedCourse));
      dispatch(fetchCourseClassmates(featureFlow.sharedCourse.id));
      break;
    case 'FIND_FRIENDS':
      dispatch({ type: ActionTypes.TOGGLE_PEER_MODAL });
      break;
    case 'ENABLE_NOTFIS':
      dispatch({ type: ActionTypes.SET_HIGHLIGHT_NOTIFS, highlightNotifs: true });
      if (!currentUser.isLoggedIn) {
        dispatch({ type: ActionTypes.TRIGGER_SIGNUP_MODAL });
      } else {
        dispatch({
          type: ActionTypes.OVERRIDE_SETTINGS_SHOW,
          data: true,
        });
      }
      break;
    case 'FINAL_EXAMS':
      dispatch({ type: ActionTypes.SHOW_FINAL_EXAMS_MODAL });
      dispatch({ type: ActionTypes.SET_EXAM_SEMESTERS, exams: featureFlow.exams });
      break;
    default:
      // unexpected feature name
      break;
  }
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
