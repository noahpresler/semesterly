import fetch from 'isomorphic-fetch';
import { getCourseSearchEndpoint, 
				getAdvancedSearchEndpoint,
				getSchoolSpecificInfo } from '../constants.jsx';
import { store } from '../init.jsx';
import { getUserSavedTimetables, saveTimetable } from './user_actions.jsx';
import { nullifyTimetable } from './timetable_actions.jsx';

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

export function setSemester(semester) {
	let state = store.getState();
	let dispatch = store.dispatch;

	if (state.userInfo.data.isLoggedIn) {
		dispatch(getUserSavedTimetables(allSemesters[semester]));
	}
	else {
		nullifyTimetable(dispatch);
	}

	dispatch({
		type: "SET_SEMESTER",
		semester
	});
	dispatch({
		type: "RECEIVE_COURSES",
		courses: []
	});
}

/*
 * Check whether the user is logged in and whether their timetable is up to date
 * and set semester if appropriate. Otherwise show an alert modal and save the
 * semester they were trying to switch to in the modal state.
 */
export function maybeSetSemester(semester) {
	let state = store.getState();
	let dispatch = store.dispatch;

	if (semester === state.semesterIndex) { return; }

	if (state.timetables.items[state.timetables.active].courses.length > 0) {
		if (state.userInfo.data.isLoggedIn && !state.savingTimetable.upToDate) {
			dispatch(saveTimetable(false, () => setSemester(semester)));
		}
		else if (state.userInfo.data.isLoggedIn) {
			setSemester(semester);
		}
		else {
			dispatch({
				type: "ALERT_CHANGE_SEMESTER",
				semester,
			});
		}
	} else {
		setSemester(semester);
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
		fetch(getCourseSearchEndpoint(query), {
			credentials: 'include'
		})
		.then(response => response.json()) // TODO(rohan): error-check the response
		.then(json => {
			// indicate that courses have been received
			dispatch(receiveCourses(json));
		});
	}
}

export function fetchAdvancedSearchResults(query, filters) {
	return (dispatch) => {

		// if too small a query AND no filters; don't make request.
		// we'll allow small query strings if some filters (departments, or breadths, or levels) are chosen.
		if (query.length <= 1 && [].concat(...Object.values(filters)).length === 0) {
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
		let state = store.getState()
		fetch(getAdvancedSearchEndpoint(), {
			credentials: 'include',
			method: 'POST',
			body: JSON.stringify({
				query,
				filters,
				semester: allSemesters[state.semesterIndex]
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
