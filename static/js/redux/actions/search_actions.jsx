import fetch from 'isomorphic-fetch';
import { getCourseSearchEndpoint } from '../constants.jsx';

export function requestCourses() {
  return {
    type: "REQUEST_COURSES",
  }
}

export function receiveCourses(json) {
  return {
    type: "RECEIVE_COURSES",
    courses: json.results,
  }
}

export function fetchSearchResults(query) {
	return (dispatch) => {
		if (query.length == 0) {
			dispatch(receiveCourses({results: []}));
			return;
		}
		// indicate that we are now requesting courses
		dispatch(requestCourses());
		// send a request (via fetch) to the appropriate endpoint to get courses
		fetch(getCourseSearchEndpoint(query))
		.then(response => response.json()) // TODO(rohan): error-check the response
		.then(json => {
			// indicate that courses have been received
			dispatch(receiveCourses(json));
		});
	}
}

	// return (dispatch) => fetch("http://127.0.0.1:8000/courses/jhu/F", {
 //      method: 'POST',
 //      body: JSON.stringify({"email": "lmao"})
 //    })

