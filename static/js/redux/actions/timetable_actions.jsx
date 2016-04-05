import fetch from 'isomorphic-fetch';
import { getTimetablesEndpoint } from '../constants.jsx';

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

export function fetchTimetables(state) {
	return (dispatch) => {
		// mark that we are now requesting timetables (asynchronously)
		dispatch(requestTimetables());
		// send a request (via fetch) to the appropriate endpoint with
		// relevant data as contained in @state (including courses, preferences, etc)
		fetch(getTimetablesEndpoint(), {
      		method: 'POST',
      		body: JSON.stringify(state)
    	})
		.then(response => response.json()) // TODO(rohan): error-check the response
		.then(json => {
			// mark that timetables have been received
			dispatch(receiveTimetables(json));
		});
	}
}
