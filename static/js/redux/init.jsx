import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, combineReducers } from 'redux';
import { school } from './reducers/school_reducer.jsx';
import { semester } from './reducers/semester_reducer.jsx';
import { courseSections } from './reducers/course_sections_reducer.jsx';
import { preferences } from './reducers/preferences_reducer.jsx';
import { randomString } from './util.jsx';

var SID = randomString(30);
const Semesterly = combineReducers({
	school,
	semester,
	courseSections,
	preferences,
	sid: SID
});

const store = createStore(Semesterly);
