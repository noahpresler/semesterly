import fetch from 'isomorphic-fetch';
import { getCourseSearchEndpoint, getAdvancedSearchEndpoint } from '../constants.jsx';
import { store } from '../init.jsx';

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
		if (query.length <= 1) {
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

export function fetchAdvancedSearchResults(query, filters) {
	return (dispatch) => {
		if (query.length <= 1) {
			dispatch({  
				type: "RECEIVE_ADVANCED_SEARCH_RESULTS",
				advancedSearchResults: []
			});
			return;
		}
		// indicate that we are now requesting courses
		dispatch({  
			type: "REQUEST_ADVANCED_SEARCH_RESULTS",
		});
		// send a request (via fetch) to the appropriate endpoint to get courses
		fetch(getAdvancedSearchEndpoint(), {
			credentials: 'include',
			method: 'POST',
			body: JSON.stringify({
				query,
				filters,
				semester: store.getState().semester
			})
		})
		.then(response => response.json()) // TODO(rohan): error-check the response
		.then(json => {
			// indicate that courses have been received
			dispatch({  
				type: "RECEIVE_ADVANCED_SEARCH_RESULTS",
				advancedSearchResults: json
			});
		});
	}
}
