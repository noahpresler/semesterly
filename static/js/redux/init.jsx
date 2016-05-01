import 'babel-polyfill';
import React from 'react';
import { render } from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { Provider } from 'react-redux';
import { rootReducer } from './reducers/root_reducer.jsx';
import SemesterlyContainer from './ui/containers/semesterly_container.jsx';
import { getLocalTimetable } from './util.jsx';
export const store = createStore(rootReducer, applyMiddleware(thunkMiddleware));

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
	return store.getState().school;
}
export const getSemester = () => {
	return store.getState().semester;
}
