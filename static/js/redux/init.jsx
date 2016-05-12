import 'babel-polyfill';
import React from 'react';
import { render } from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { Provider } from 'react-redux';
import { rootReducer } from './reducers/root_reducer.jsx';
import SemesterlyContainer from './ui/containers/semesterly_container.jsx';
import { fetchUserInfo } from './actions/user_actions.jsx'
import { getLocalTimetable } from './util.jsx';
export const store = createStore(rootReducer, applyMiddleware(thunkMiddleware));

store.dispatch(
  fetchUserInfo()
)

render(
  <Provider store={store}>
    <SemesterlyContainer />
  </Provider>, document.getElementById("page"));
    //<Calendar timetables={state.timetables.items} />

store.dispatch(
	{
		type: "SET_SCHOOL",
		school: window.location.hostname.split(".")[0]
	}
);
store.dispatch(
  {
    type: "SET_SEMESTER",
    semester: "F"
  }
);

export const getSchool = () => {
  console.log(store.getState());
	return store.getState().school;
}
export const getSemester = () => {
	return store.getState().semester;
}
