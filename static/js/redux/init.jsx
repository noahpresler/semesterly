import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { school } from './reducers/school_reducer.jsx';
import { semester } from './reducers/semester_reducer.jsx';
import { courseSections } from './reducers/course_sections_reducer.jsx';
import { timetables } from './reducers/timetables_reducer.jsx';
import { preferences } from './reducers/preferences_reducer.jsx';
import { fetchCourses } from './actions/course_actions.jsx';
import { fetchTimetables } from './actions/timetable_actions.jsx';
import { Calendar } from './ui/calendar.jsx';
import { SearchBar } from './ui/search_bar.jsx';

let data = combineReducers({
  school,
  semester,
  timetables,
  courseSections,
  preferences,
});
const Semesterly = combineReducers({
  data
});

const store = createStore(Semesterly, applyMiddleware(thunkMiddleware));

const render = () => {
    let state = store.getState();
    // console.log("State is now", state);
    ReactDOM.render(
      <div>
        <SearchBar addCourse={
          (newCourse) => store.dispatch(fetchTimetables(state.data, newCourse))
        }/>
        <Calendar timetables={state.data.timetables.items} />
    </div>, document.getElementById("page"));
};
render();
store.subscribe(render);
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
	return store.getState().data.school;
}
export const getSemester = () => {
	return store.getState().data.semester;
}
export const hoverCourse = (course) => {
  store.dispatch({
    type: "HOVER_COURSE",
    course,
  });
}
export const unHoverCourse = () => {
  store.dispatch({
    type: "UNHOVER_COURSE",
  });
}
