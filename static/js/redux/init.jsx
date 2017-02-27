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
import { setCourseInfo } from './actions/modal_actions.jsx';
import { browserSupportsLocalStorage, setFirstVisit, timeLapsedGreaterThan, setFriendsCookie } from './util.jsx';
import { addTTtoGCal } from './actions/calendar_actions.jsx';
import { fetchMostClassmatesCount } from './actions/user_actions.jsx';

export const store = createStore(rootReducer, window.devToolsExtension && window.devToolsExtension(), applyMiddleware(thunkMiddleware));

export const getSchool = () => {
  return store.getState().school.school;
}
export const getSemester = () => {
  return store.getState().semester;
}

// setup the state. loads the user's timetables if logged in; cached timetable if not.
// also handles sharing courses and sharing timetables
function setup(dispatch) {

  dispatch({
    type: "SET_SCHOOL",
    school // comes from timetable.html
  });

  dispatch({
    type: "SET_SEMESTER",
    semester: currentSemester, // currentSemester comes from timetable.html (rendered by the server). if the user is loading a share course link, we need to set the appropriate semester, so we can't default it to any particular value
  });
  sharedTimetable = JSON.parse(sharedTimetable);
  sharedCourse = JSON.parse(sharedCourse);
  findFriends = findFriends === "True";
  enableNotifs = enableNotifs === "True";
  uses12HrTime = uses12HrTime === "True";
  studentIntegrations = JSON.parse(studentIntegrations);
  signup = signup === "True";
  gcalCallback = gcalCallback === "True";
  exportCalendar = exportCalendar === "True";
  viewTextbooks = viewTextbooks === "True";
  if (signup) {
    dispatch({type: 'TRIGGER_SIGNUP_MODAL'});
  }
  if (gcalCallback) {
    dispatch({type: 'TRIGGER_SAVE_CALENDAR_MODAL'});
    dispatch(addTTtoGCal());
  }
  if (exportCalendar) {
    dispatch({type: 'TRIGGER_SAVE_CALENDAR_MODAL'});
  }
  /* first setup the user's state */
  let user = JSON.parse(currentUser); // currentUser comes from timetable.html
  dispatch(getUserInfo(user));
  if (!sharedTimetable) { // we load user's timetable (or cached timetable) only if they're _not_ trying to load a shared timetable
    if (user.isLoggedIn && user.timetables.length > 0) { // user is logged in and has saved timetables
      // load one of the user's saved timetables (after initial page load). also fetches classmates
      loadTimetable(user.timetables[0]);
      dispatch({ type: "RECEIVE_TIMETABLE_SAVED", upToDate: true });
      setTimeout(() => {
        dispatch(fetchMostClassmatesCount(user.timetables[0].courses.map(c => c['id'])));
      }, 500);
    }
    else { // user isn't logged in (or has no saved timetables); load last browser-cached timetable, under certain conditions.
    // we only load the browser-cached timetable if the shared course's semester is the same as the browser-cached timetable's semester OR the user is not trying to load a shared course at all. This results in problematic edge cases, such as showing the course modal of an S course in the F semester, being completely avoided.
      if (browserSupportsLocalStorage() && (localStorage.semester === currentSemester || !sharedCourse)) {
        loadCachedTimetable();
      }
    }
  }

  if (gcalCallback) {
    dispatch({type: 'TRIGGER_SAVE_CALENDAR_MODAL'});
    dispatch(addTTtoGCal());
  }
  if (viewTextbooks) {
    dispatch({type: 'TRIGGER_TEXTBOOK_MODAL'})
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
          dispatch({type: "ALERT_ENABLE_NOTIFICATIONS"});
        }
      } else { // if after second visit
        if (localStorage.getItem("declinedNotifications") === true || localStorage.getItem("declinedNotifications") === false) {
          // do nothing : either accpeted or declined notigications
        } else if (timeLapsedGreaterThan(localStorage.getItem("declinedNotifications"), 3) === true) {
          // deploy upsell pop for chrome notifications
          dispatch({type: "ALERT_ENABLE_NOTIFICATIONS"});
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
      dispatch({type: "ALERT_FACEBOOK_FRIENDS"});
    } else {
      if (timeLapsedGreaterThan(localStorage.getItem("friendsCookie"), 3) === true) { // if visit is more than 3 days of last friend alert
        let time = new Date();
        setFriendsCookie(time.getTime());
        dispatch({type: "ALERT_FACEBOOK_FRIENDS"});
      }
    }
  }

  /* now setup sharing state */
  if (sharedTimetable) {
    lockTimetable(dispatch, sharedTimetable, true, user.isLoggedIn);
  } else if (sharedCourse) {
    dispatch(setCourseInfo(sharedCourse));
  } else if (findFriends) {
    dispatch({type: "TOGGLE_PEER_MODAL"});
  }
  if (enableNotifs) {
    if (!user.isLoggedIn) {
      dispatch({type: 'TRIGGER_SIGNUP_MODAL'})
    } else {
      dispatch({
        type: "OVERRIDE_SETTINGS_SHOW",
        data: true,
      })
    }
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