import 'babel-polyfill';
import React from 'react';
import { render } from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { Provider } from 'react-redux';
import { rootReducer } from './reducers/root_reducer.jsx';
import SemesterlyContainer from './ui/containers/semesterly_container.jsx';
import { getUserInfo, setARegistrationToken, isRegistered } from './actions/user_actions.jsx';
import { loadTimetable, lockTimetable, loadCachedTimetable } from './actions/timetable_actions.jsx'
import { fetchSchoolInfo } from './actions/school_actions.jsx';
import { setCourseInfo, fetchCourseClassmates } from './actions/modal_actions.jsx';
import { browserSupportsLocalStorage, setFirstVisit, timeLapsedGreaterThan, setFriendsCookie } from './util.jsx';
import { addTTtoGCal } from './actions/calendar_actions.jsx';
import { fetchMostClassmatesCount } from './actions/user_actions.jsx';
import { getSchoolSpecificInfo } from './constants/schools.jsx';
import * as ActionTypes from './constants/actionTypes.jsx'

export const store = createStore(rootReducer, window.devToolsExtension && window.devToolsExtension(), applyMiddleware(thunkMiddleware));

// get functions used to get backend endpoints
export const getSchool = () => {
  return store.getState().school.school;
}
export const getSemester = () => {
  let state = store.getState()
  let currSemester = allSemesters[state.semesterIndex]
  return currSemester.name + "/" + currSemester.year
}

// setup the state. loads the user's timetables if logged in; cached timetable if not.
// also handles sharing courses and sharing timetables
function setup(dispatch) {

  dispatch({
    type: ActionTypes.SET_SCHOOL,
    school // comes from timetable.html
  });

  dispatch({
    type: ActionTypes.SET_SEMESTER,
    semester: parseInt(currentSemester), // currentSemester comes from timetable.html (rendered by the server). if the user is loading a share course link, we need to set the appropriate semester, so we can't default it to any particular value
  });
  allSemesters = JSON.parse(allSemesters);
  sharedTimetable = JSON.parse(sharedTimetable);
  sharedCourse = JSON.parse(sharedCourse);
  finalExamsSupportedSemesters = JSON.parse(finalExamsSupportedSemesters);
  findFriends = findFriends === "True";
  enableNotifs = enableNotifs === "True";
  uses12HrTime = uses12HrTime === "True";
  studentIntegrations = JSON.parse(studentIntegrations);
  signup = signup === "True";
  userAcq = userAcq === "True";
  gcalCallback = gcalCallback === "True";
  exportCalendar = exportCalendar === "True";
  viewTextbooks = viewTextbooks === "True";
  finalExams = finalExams === "True";
  if (signup) {
    dispatch({type: ActionTypes.TRIGGER_SIGNUP_MODAL});
  }
  if (userAcq) {
    dispatch({type: ActionTypes.TRIGGER_ACQUISITION_MODAL});
  }
  if (gcalCallback) {
    dispatch({type: ActionTypes.TRIGGER_SAVE_CALENDAR_MODAL});
    dispatch(addTTtoGCal());
  }
  if (exportCalendar) {
    dispatch({type: ActionTypes.TRIGGER_SAVE_CALENDAR_MODAL});
  }
  /* first setup the user's state */
  let user = JSON.parse(currentUser); // currentUser comes from timetable.html
  dispatch(getUserInfo(user));
  if (!sharedTimetable) { // we load user's timetable (or cached timetable) only if they're _not_ trying to load a shared timetable
    if (user.isLoggedIn && user.timetables.length > 0) { // user is logged in and has saved timetables
      // load one of the user's saved timetables (after initial page load). also fetches classmates
      loadTimetable(user.timetables[0]);
      dispatch({ type: ActionTypes.RECEIVE_TIMETABLE_SAVED, upToDate: true });
      setTimeout(() => {
        dispatch(fetchMostClassmatesCount(user.timetables[0].courses.map(c => c['id'])));
      }, 500);
      dispatch({type: ActionTypes.CACHED_TT_LOADED});
    }
    else { // user isn't logged in (or has no saved timetables); load last browser-cached timetable, under certain conditions.
    // we only load the browser-cached timetable if the shared course's semester is the same as the browser-cached timetable's semester OR the user is not trying to load a shared course at all. This results in problematic edge cases, such as showing the course modal of an S course in the F semester, being completely avoided.
      if (browserSupportsLocalStorage() && (localStorage.semester === currentSemester || !sharedCourse)) {
        loadCachedTimetable(dispatch);
      } else {
        dispatch({type: ActionTypes.CACHED_TT_LOADED});
      }
    }
  } else {
    dispatch({type: ActionTypes.CACHED_TT_LOADED});
  }

  if (gcalCallback) {
    dispatch({type: ActionTypes.TRIGGER_SAVE_CALENDAR_MODAL});
    dispatch(addTTtoGCal());
  }
  if (viewTextbooks) {
    dispatch({type: ActionTypes.TRIGGER_TEXTBOOK_MODAL})
  }
  // check if registered for chrome notifications
  isRegistered();
  // check if first visit
  if (browserSupportsLocalStorage() && 'serviceWorker' in navigator) {
    if (localStorage.getItem("firstVisit") === null) {
      let time = new Date();
      setFirstVisit(time.getTime());
    } else {
      if (localStorage.getItem("declinedNotifications") === null) { // if second visit
        if (timeLapsedGreaterThan(localStorage.getItem("firstVisit"), 1) === true) { // if second visit is one day after first visit
          // deploy upsell pop for chrome notifications
          dispatch({type: ActionTypes.ALERT_ENABLE_NOTIFICATIONS});
        }
      } else { // if after second visit
        if (localStorage.getItem("declinedNotifications") === true || localStorage.getItem("declinedNotifications") === false) {
          // do nothing : either accpeted or declined notigications
        } else if (timeLapsedGreaterThan(localStorage.getItem("declinedNotifications"), 3) === true) {
          // deploy upsell pop for chrome notifications
          dispatch({type: ActionTypes.ALERT_ENABLE_NOTIFICATIONS});
        } else {
          // console.log(localStorage.getItem("declinedNotifications"), timeLapsedGreaterThan(localStorage.getItem("declinedNotifications"), .0001157));
        }
      }
    }
  }

  //check if showed friends alert in the last 3 days
  if (browserSupportsLocalStorage() && 'serviceWorker' in navigator) {
    if (localStorage.getItem("friendsCookie") === null) {
      let time = new Date();
      setFriendsCookie(time.getTime());
      dispatch({type: ActionTypes.ALERT_FACEBOOK_FRIENDS});
    } else {
      if (timeLapsedGreaterThan(localStorage.getItem("friendsCookie"), 3) === true) { // if visit is more than 3 days of last friend alert
        let time = new Date();
        setFriendsCookie(time.getTime());
        dispatch({type: ActionTypes.ALERT_FACEBOOK_FRIENDS});
      }
    }
  }

  /* now setup sharing state */
  if (sharedTimetable) {
    lockTimetable(dispatch, sharedTimetable, true, user.isLoggedIn);
  } else if (sharedCourse) {
    dispatch(setCourseInfo(sharedCourse));
    dispatch(fetchCourseClassmates(sharedCourse.id));
  } else if (findFriends) {
    dispatch({type: ActionTypes.TOGGLE_PEER_MODAL});
  }
  if (enableNotifs) {
    if (!user.isLoggedIn) {
      dispatch({type: ActionTypes.TRIGGER_SIGNUP_MODAL})
    } else {
      dispatch({
        type: ActionTypes.OVERRIDE_SETTINGS_SHOW,
        data: true,
      })
    }
  }
  if (finalExams) {
    dispatch({type: ActionTypes.SHOW_FINAL_EXAMS_MODAL});
  }
}

setup(store.dispatch);

// asynchronously get the school's specific info, including departments,
// areas, etc
store.dispatch(
  fetchSchoolInfo()
)

render(
  <Provider store={store}>
    <SemesterlyContainer />
  </Provider>, document.getElementById("page"));
