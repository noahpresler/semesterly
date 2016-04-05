import fetch from 'isomorphic-fetch';
import { getTimetablesEndpoint } from '../constants.jsx';
import { randomString } from '../util.jsx';

export const SID = randomString(30);

export function requestTimetables() {
  return {
    type: "REQUEST_TIMETABLES",
  }
}

export function receiveTimetables(json) {
  return {
    type: "RECEIVE_TIMETABLES",
    courses: json.courses,
    lastUpdated: json.last_updated
  }
}
/* 
Returns the body of the request used to get new timetables
*/
function getReqBody(dataState){

	return {
		school: dataState.school,
		semester: dataState.semester,
		courseSections: dataState.courseSections,
		preferences: dataState.preferences,
		updated_courses: [{'course_id': 35485,
                          'section_codes': ['']}],
        index: 0,
		sid: SID
	}
}
      
export function fetchTimetables(state) {
	return (dispatch) => {
		console.log("Making request with request body:", getReqBody(state));
		// mark that we are now requesting timetables (asynchronously)
		dispatch(requestTimetables());
		// send a request (via fetch) to the appropriate endpoint with
		// relevant data as contained in @state (including courses, preferences, etc)
		fetch(getTimetablesEndpoint(), {
      		method: 'POST',
      		body: JSON.stringify(getReqBody(state))
    	})
		.then(response => response.json()) // TODO(rohan): error-check the response
		.then(json => {
			// mark that timetables have been received
			dispatch(receiveTimetables(json));
		});
	}
}
