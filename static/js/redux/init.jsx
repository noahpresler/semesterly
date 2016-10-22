import 'babel-polyfill';
import React from 'react';
import { render } from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { Provider } from 'react-redux';
import { rootReducer } from './reducers/root_reducer.jsx';
import SemesterlyContainer from './ui/containers/semesterly_container.jsx';
import { getUserInfo } from './actions/user_actions.jsx';
import { loadTimetable, lockTimetable, loadCachedTimetable } from './actions/timetable_actions.jsx'
import { fetchSchoolInfo } from './actions/school_actions.jsx';
import { setCourseInfo } from './actions/modal_actions.jsx';
import { browserSupportsLocalStorage } from './util.jsx';

export const store = createStore(rootReducer, window.devToolsExtension && window.devToolsExtension(), applyMiddleware(thunkMiddleware));

export const getSchool = () => {
  return store.getState().school.school;
}
export const getSemester = () => {
  return store.getState().semester;
}

function getCookie(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");
  if (parts.length == 2) return parts.pop().split(";").shift();
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
  uses12HrTime = uses12HrTime === "True"
  /* first setup the user's state */
  let user = JSON.parse(currentUser); // currentUser comes from timetable.html
  dispatch(getUserInfo(user));
  if (!sharedTimetable) { // we load user's timetable (or cached timetable) only if they're _not_ trying to load a shared timetable
    if (user.isLoggedIn && user.timetables.length > 0) { // user is logged in and has saved timetables
      // load one of the user's saved timetables (after initial page load). also fetches classmates
      loadTimetable(user.timetables[0]);
      dispatch({ type: "RECEIVE_TIMETABLE_SAVED", upToDate: true });
    }
    else { // user isn't logged in (or has no saved timetables); load last browser-cached timetable, under certain conditions.
    // we only load the browser-cached timetable if the shared course's semester is the same as the browser-cached timetable's semester OR the user is not trying to load a shared course at all. This results in problematic edge cases, such as showing the course modal of an S course in the F semester, being completely avoided.
      if (browserSupportsLocalStorage() && (localStorage.semester === currentSemester || !sharedCourse)) {
        loadCachedTimetable();
      }
    }
  }

  if (browserSupportsLocalStorage()) {
    var parts = location.hostname.split('.');
    var subdomain = parts.shift();
    var upperleveldomain = "." + parts.join('.');
    document.cookie="school=" + school + "; domain=" + upperleveldomain + "; path=/";
  }

  /* now setup sharing state */

  if (sharedTimetable) {
    lockTimetable(dispatch, sharedTimetable, true, user.isLoggedIn);
  }
  else if (sharedCourse) {
    dispatch(setCourseInfo(sharedCourse));
  } else if (findFriends) {
    dispatch({type: "TOGGLE_PEER_MODAL"});
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
