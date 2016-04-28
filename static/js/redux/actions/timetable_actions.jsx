import fetch from 'isomorphic-fetch';
import { getTimetablesEndpoint } from '../constants.jsx';
import { randomString } from '../util.jsx';
import { store } from '../init.jsx';

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

/* 
Returns the body of the request used to get new timetables
*/
function getReqBody(newCourse, lockingSection, removing, state){
	let reqBody = {
		school: state.school,
		semester: state.semester,
		courseSections: state.courseSections,
		preferences: state.preferences,
    	index: 0,
		sid: SID
	}
	if (removing) {
		let updatedCourseSections = Object.assign({}, state.courseSections);
		delete updatedCourseSections[newCourse.id]; // remove it from courseSections
		reqBody.courseSections = updatedCourseSections;
	}
	else { // adding a course
		Object.assign(reqBody, {
			updated_courses: [{
				'course_id': newCourse.id,
        		'section_codes': [lockingSection]
        	}]
        });
	}
	return reqBody;
}

export function fetchTimetables(newCourse) {
	return (dispatch) => {
		// mark that we are now requesting timetables (asynchronously)
		dispatch(requestTimetables());

		let state = store.getState();
		let lockingSection = newCourse.section || '';
		let removing = state.courseSections[newCourse.id] !== undefined && lockingSection === '';
		// send a request (via fetch) to the appropriate endpoint with
		// relevant data as contained in @state (including courses, preferences, etc)
		fetch(getTimetablesEndpoint(), {
      		method: 'POST',
      		body: JSON.stringify(getReqBody(newCourse, lockingSection, removing, state))
    	})
		.then(response => response.json()) // TODO(rohan): error-check the response
		.then(json => {
			if (removing || json.timetables.length > 0) {
				// mark that timetables and a new courseSections have been received
				dispatch(receiveTimetables(json.timetables));
				dispatch(receiveCourseSections(json.new_c_to_s));
			}
			else {
				// course added by the user resulted in a conflict, so no timetables
				// were received
				dispatch(alertConflict());
			}
		});
	}
}
