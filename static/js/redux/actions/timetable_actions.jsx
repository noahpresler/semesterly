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
  // console.log("Timetables are:", timetables);
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
/* 
Returns the body of the request used to get new timetables
*/
function getReqBody(newCourse){
	let state = store.getState();
	let section = newCourse.section || '';

	return {
		school: state.school,
		semester: state.semester,
		courseSections: state.courseSections,
		preferences: state.preferences,
		updated_courses: [{'course_id': newCourse.id,
                        'section_codes': [section]}],
    index: 0,
		sid: SID
	}
}

export function fetchTimetables(newCourse) {
	return (dispatch) => {
		// mark that we are now requesting timetables (asynchronously)
		dispatch(requestTimetables());
		// send a request (via fetch) to the appropriate endpoint with
		// relevant data as contained in @state (including courses, preferences, etc)
		fetch(getTimetablesEndpoint(), {
      		method: 'POST',
      		body: JSON.stringify(getReqBody(newCourse))
    	})
		.then(response => response.json()) // TODO(rohan): error-check the response
		.then(json => {
			// mark that timetables and a new courseSections have been received
			dispatch(receiveTimetables(json.timetables));
			dispatch(receiveCourseSections(json.new_c_to_s));
		});
	}
}
