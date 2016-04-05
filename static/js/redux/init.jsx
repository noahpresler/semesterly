import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { school } from './reducers/school_reducer.jsx';
import { semester } from './reducers/semester_reducer.jsx';
import { courses } from './reducers/courses.jsx';
import { courseSections } from './reducers/course_sections_reducer.jsx';
import { preferences } from './reducers/preferences_reducer.jsx';
import { randomString } from './util.jsx';
import { fetchCourses } from './actions/course_actions.jsx'

var SID = randomString(30);
const Semesterly = combineReducers({
	school,
	semester,
  courses,
	courseSections,
	preferences,
	sid: SID
});

const store = createStore(Semesterly, applyMiddleware(thunkMiddleware));
const AddCourse = ({ onRequest }) => (
       <div>
           <button onClick={onRequest}>+</button>
       </div>
);
const render = () => {
       let state = store.getState();
       console.log(state);
       ReactDOM.render(<AddCourse
                   onRequest={() =>
                   //store.dispatch(fetchCourses(state.school, state.semester))}
                   store.dispatch(fetchCourses("uoft", "F"))}
               />,
               document.getElementById('page')
       );
};
render();
store.subscribe(render);
