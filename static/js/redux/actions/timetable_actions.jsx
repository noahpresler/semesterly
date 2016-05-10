import fetch from 'isomorphic-fetch';
import { getTimetablesEndpoint } from '../constants.jsx';
import { randomString } from '../util.jsx';
import { store } from '../init.jsx';
import { getClassmatesEndpoint } from '../constants.jsx'
import { lockActiveSections } from './user_actions.jsx';

export const SID = randomString(30);

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
export function receiveCourseSections(newCourseSections) {
  return {
    type: "RECEIVE_COURSE_SECTIONS",
    courseSections: newCourseSections,
  }
}
export function alertConflict(){
	return {
		type: "ALERT_CONFLICT"
	}
}

export function loadTimetable(timetable) {
	let dispatch = store.dispatch;
	dispatch({
		type: "CHANGE_ACTIVE_SAVED_TIMETABLE",
		timetable,
	});
	dispatch({
		type: "RECEIVE_TIMETABLES",
		timetables: [timetable],
		preset: true
	});
	dispatch({
		type: "RECEIVE_COURSE_SECTIONS",
		courseSections: lockActiveSections(timetable)
	});
}

/* 
Returns the body of the request used to get new timetables
*/
function getBaseReqBody(state){
	return {
		school: state.school,
		semester: state.semester,
		courseSections: state.courseSections.objects,
		preferences: state.preferences,
		sid: SID
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
        	}]
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
				dispatch(receiveCourseSections(json.new_c_to_s));
				if (store.getState().userInfo.data.isLoggedIn && json.timetables[0] !== undefined)
					dispatch(fetchClassmates(json.timetables[0].courses.map( c => c['id'])))
			}
			else {
				// course added by the user resulted in a conflict, so no timetables
				// were received
				dispatch(alertConflict());
			}
		});
	}
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

function fetchClassmates(courses) {
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
