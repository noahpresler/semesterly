import 'babel-polyfill';
import React from 'react';
import { render } from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { Provider } from 'react-redux';
import { rootReducer } from './reducers/root_reducer.jsx';
import SemesterlyContainer from './ui/containers/semesterly_container.jsx';
import { getUserInfo } from './actions/user_actions.jsx';
import { fetchSchoolInfo, loadTimetable, loadCachedTimetable } from './actions/timetable_actions.jsx'
export const store = createStore(rootReducer, applyMiddleware(thunkMiddleware));

export const getSchool = () => {
  return store.getState().school.school;
}
export const getSemester = () => {
  return store.getState().semester;
}

store.dispatch(
  {
    type: "SET_SCHOOL",
    school // comes from timetable.html
  }
);
store.dispatch(
  {
    type: "SET_SEMESTER",
    semester: "F",
  }
);
// setup the state. loads the user's timetables if logged in; cached timetables if not.
// also handles sharing courses and sharing timetables
function setup(dispatch) {
  let user = currentUser; // comes from timetable.html
  dispatch(getUserInfo(user));
  if (user.timetables && user.timetables.length > 0) { // user had saved timetables
    // loading one of the user's timetables (after initial page load)
    loadTimetable(user.timetables[0]);
    dispatch({type: "RECEIVE_TIMETABLE_SAVED"});
  }
  else { // load last browser-cached timetable
    loadCachedTimetable();
  }
  return user;
}

setup(store.dispatch)

// asynchronously get the school's specific info, including departments,
// areas, etc
store.dispatch(
  fetchSchoolInfo()
)

render(
  <Provider store={store}>
    <SemesterlyContainer />
  </Provider>, document.getElementById("page"));
