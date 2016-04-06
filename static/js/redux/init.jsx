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
import { fetchCourses } from './actions/course_actions.jsx';
import { fetchTimetables } from './actions/timetable_actions.jsx';
import { Calendar } from './ui/calendar.jsx';
import { CourseModal } from './ui/course_modal.jsx';

let data = combineReducers({
  school,
  semester,
  courses,
  courseSections,
  preferences,
});
const Semesterly = combineReducers({
  data
});

const store = createStore(Semesterly, applyMiddleware(thunkMiddleware));
// const AddCourse = ({ onRequest, onRequestTimetables, onAddCourse }) => (
//        <div>
//            <button onClick={onRequest}>Get Courses then -></button>
//            <button onClick={onAddCourse}>Add Course then -></button>
//            <button onClick={() => store.dispatch(
//               {
//                 type: "SET_SCHOOL",
//                 school: "uoft"
//               })
//            }>Set School then -></button>
//            <button onClick={() => store.dispatch(
//               {
//                 type: "SET_SEMESTER",
//                 semester: "F"
//               })
//            }>Set Semester then -></button>
//            <button onClick={onRequestTimetables}>Finally, Get Timetables!</button>

//        </div>

// );
// // tester render function contents:
// const render = () => {
// 	console.log(store.getState());
// 	let state = store.getState();
// 	ReactDOM.render(<AddCourse
//           onRequest={() =>
//           //store.dispatch(fetchCourses(state.school, state.semester))}
//           store.dispatch(fetchCourses("uoft", "F"))}
//           onRequestTimetables={() =>
//           store.dispatch(fetchTimetables(state.data))}
//           onAddCourse={() => store.dispatch({type:"ADD_COURSE"})}
//         />,
//         document.getElementById('page')
//       );
// }
const render = () => {
	console.log(store.getState());
    ReactDOM.render(<div><CourseModal /><Calendar /></div>, document.getElementById("page"));
};
render();
store.subscribe(render);

