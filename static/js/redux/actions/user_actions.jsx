import fetch from 'isomorphic-fetch';
import { getUserInfoEndpoint, getSaveTimetableEndpoint } from '../constants.jsx';
import { store } from '../init.jsx';

export function getUserInfo(json) {
	return {
		type: "USER_INFO_RECEIVED",
		data: json
	};
}

export function requestUserInfo(id) {
  return {
    type: "REQUEST_USER_INFO",
  }
}

export function fetchUserInfo() {
	return (dispatch) => {

		dispatch(requestUserInfo());

		fetch(getUserInfoEndpoint(), { credentials: 'include' })
		    .then(response => response.json()) // TODO(rohan): error-check the response
		    .then(json => {
		        dispatch(getUserInfo(json))
		    });
	}
}

function getSaveTimetablesRequestBody() {
	let state = store.getState();
	let timetableState = state.timetables;
	let name = state.savingTimetable.name;
	return {
		timetable: timetableState.items[timetableState.active],
		name,
	}
}

/* Locks all the active timetable's sections */
function getActiveTimetable() {
	let timetableState = store.getState().timetables;
	let activeTimetable = timetableState.items[timetableState.active];
	let newActive = Object.assign({}, activeTimetable);
	return newActive;
}

export function saveTimetable() {
	return (dispatch) => {
		// mark that we're now trying to save this timetable
		dispatch({
			type: "REQUEST_SAVE_TIMETABLE"
		});
		// mark that the current timetable is now the only available one
		dispatch({
			type: "RECEIVE_TIMETABLES",
			timetables: [getActiveTimetable()]
		});
		// edit the state courseSections, so that future requests to add/remove/unlock
		// courses are handled correctly. in the new courseSections, every currently active
		// section will be locked
		// dispatch({
		// 	type: "RECEIVE_COURSE_SECTIONS",
		// 	courseSections: {}
		// });
		fetch(getSaveTimetableEndpoint(), {
      		method: 'POST',
      		body: JSON.stringify(getSaveTimetablesRequestBody()),
      		credentials: 'include',
    	})
		.then(response => dispatch({
			type: "RECEIVE_TIMETABLE_SAVED"
		}));
	}
}	
