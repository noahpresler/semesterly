import fetch from 'isomorphic-fetch';
import { getTimetablesEndpoint } from '../constants.jsx';
import { randomString } from '../util.jsx';
import { store } from '../init.jsx';
import { getClassmatesEndpoint, getSchoolInfoEndpoint } from '../constants.jsx'
import { lockActiveSections } from './user_actions.jsx';

export const SID = randomString(30);

export function fetchSchoolInfo() {
	return (dispatch) => {
		fetch(getSchoolInfoEndpoint())
	    .then(response => response.json())
	    .then(json => {
	    	
	    });
	}
}

export function requestTimetables() {
  return {
    type: "REQUEST_TIMETABLES",
  }
}

export function receiveTimetables(timetables) {
  return {
    type: "RECEIVE_TIMETABLES",
    timetables: timetables,
  }
}

export function alertConflict(){
	return {
		type: "ALERT_CONFLICT"
	}
}

export function loadTimetable(timetable, created=false) {
	let dispatch = store.dispatch;
	let state = store.getState();
	if (!state.userInfo.data.isLoggedIn) {
		return dispatch({type: 'TOGGLE_SIGNUP_MODAL'})
	}
	dispatch({
		type: "CHANGE_ACTIVE_SAVED_TIMETABLE",
		timetable,
		created
	});
	dispatch({
		type: "RECEIVE_COURSE_SECTIONS",
		courseSections: lockActiveSections(timetable)
	});
	dispatch({
		type: "RECEIVE_TIMETABLES",
		timetables: [timetable],
		preset: created === false
	});
	let userInfo = state.userInfo.data;
	if (userInfo.isLoggedIn) {
		dispatch(fetchClassmates(timetable.courses.map( c => c['id'])))
	}
}

/* 
Returns the body of the request used to get new timetables
*/
function getBaseReqBody(state){
	return {
		school: state.school.school,
		semester: state.semester,
		courseSections: state.courseSections.objects,
		preferences: state.preferences,
		sid: SID
	}
}
export function hoverSection (dispatch) {
	return (course, section) => {
		let availableSections = Object.assign({}, course.sections['L'], course.sections['T'], course.sections['P']);
		course.section = section;
		dispatch({
			type: "HOVER_COURSE",
			course: Object.assign({}, course, { slots: availableSections[section] })
		});
	}
}
export function unhoverSection (dispatch) {
	return () => {
		dispatch({
			type: "UNHOVER_COURSE",
		});
	}
}
/*
Attempts to add the course represented by newCourseId
to the user's roster. If a section is provided, that section is 
locked. Otherwise, no section is locked.
*/
export function addOrRemoveCourse(newCourseId, lockingSection = '') {
	let state = store.getState();
	if (state.timetables.isFetching) {
		return;
	}
	if (!removing && state.optionalCourses.courses.some(c => c.id === newCourseId)) {
		let dispatch = store.dispatch;
		dispatch({
	  		type: "REMOVE_OPTIONAL_COURSE_BY_ID",
	  		courseId: newCourseId
	  	});
	  	state = store.getState();
	}
	let reqBody = getBaseReqBody(state);
	// user must be removing this course if it's already in roster,
	// and they're not trying to lock a new section).
	// otherwise, they're adding it
	let removing = state.courseSections.objects[newCourseId] !== undefined && lockingSection === '';
	if (removing) {
		let updatedCourseSections = Object.assign({}, state.courseSections.objects);
		delete updatedCourseSections[newCourseId]; // remove it from courseSections.objects
		reqBody.courseSections = updatedCourseSections;
	}
	else { // adding a course
		Object.assign(reqBody, {
			updated_courses: [{
				'course_id': newCourseId,
        		'section_codes': [lockingSection]
        	}],
        	'optionCourses': state.optionalCourses.courses.map(c => c.id),
        	'numOptionCourses': state.optionalCourses.numRequired,
        	'customSlots': state.customSlots
        });
	}
	store.dispatch(fetchTimetables(reqBody, removing));
}

function fetchTimetables(requestBody, removing) {
	return (dispatch) => {
		// mark that we are now asynchronously requesting timetables
		dispatch(requestTimetables());
		// send a request (via fetch) to the appropriate endpoint with
		// relevant data as contained in @state (including courses, preferences, etc)
		fetch(getTimetablesEndpoint(), {
      		method: 'POST',
      		body: JSON.stringify(requestBody)
    	})
		.then(response => response.json()) // TODO(rohan): error-check the response
		.then(json => {
			if (removing || json.timetables.length > 0) {
				// mark that timetables and a new courseSections have been received
				dispatch(receiveTimetables(json.timetables));
				dispatch({
   					type: "RECEIVE_COURSE_SECTIONS",
    				courseSections: json.new_c_to_s,
  				});
			}
			else {
				// course added by the user resulted in a conflict, so no timetables
				// were received
				dispatch(alertConflict());
			}
			return json;
		})
		.then(json => {
			if (store.getState().userInfo.data.isLoggedIn && json.timetables[0]) {
				dispatch(fetchClassmates(json.timetables[0].courses.map( c => c['id'])))
			}
		});
	}
}

export function addCustomSlot(timeStart, timeEnd, day, preview, id) {
	let dispatch = store.dispatch;
	dispatch({
		type: "ADD_CUSTOM_SLOT",
		newCustomSlot: {
			time_start: timeStart, // match backend slot attribute names
			time_end: timeEnd,
			day: day,
			name: "New Custom Event",
			id: id,
			preview: preview
		}
	})
}

export function updateCustomSlot(newValues, id) {
	let dispatch = store.dispatch;
	dispatch({
		type: "UPDATE_CUSTOM_SLOT",
		newValues: newValues,
		id: id
	})
}

export function removeCustomSlot(id) {
	let dispatch = store.dispatch;
	dispatch({
		type: "REMOVE_CUSTOM_SLOT",
		id: id
	})
}

export function getClassmates(json) {
	return {
		type: "CLASSMATES_RECEIVED",
		courses: json
	};
}

export function requestClassmates(id) {
  return {
    type: "REQUEST_CLASSMATES",
  }
}

export function fetchClassmates(courses) {
	return (dispatch) => {

		dispatch(requestClassmates());
		fetch(getClassmatesEndpoint(), {
			credentials: 'include',
			method: 'POST',
			body: JSON.stringify({course_ids: courses})
		})
	    .then(response => response.json())
	    .then(json => {
	    	dispatch(getClassmates(json))
	    });
	}
}

export function addOrRemoveOptionalCourse(course) {
	return (dispatch) => {
		dispatch({
	  		type: "ADD_REMOVE_OPTIONAL_COURSE",
	  		newCourse: course
	  	});
	  	let state = store.getState();
	  	let reqBody = getBaseReqBody(state);
		Object.assign(reqBody, {
        	'optionCourses': state.optionalCourses.courses.map(c => c.id),
        	'numOptionCourses': state.optionalCourses.numRequired
        });
		store.dispatch(fetchTimetables(reqBody, false));
	}
}