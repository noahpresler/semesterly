import fetch from 'isomorphic-fetch';
import { getUserInfoEndpoint, getSaveTimetableEndpoint, getSaveSettingsEndpoint } from '../constants.jsx';
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

export function saveTimetable() {
	return (dispatch) => {
		dispatch({
			type: "REQUEST_SAVE_TIMETABLE"
		});
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

function getSaveSettingsRequestBody() {
	let state = store.getState();
	return {
		userInfo: state.userInfo.data
	}
}

export function saveSettings() {
	return (dispatch) => {
		dispatch({
			type: "REQUEST_SAVE_USER_INFO"
		});
		fetch(getSaveSettingsEndpoint(), {
      		method: 'POST',
      		body: JSON.stringify(getSaveSettingsRequestBody()),
      		credentials: 'include',
    	})
		.then(response => dispatch({
			type: "RECEIVE_USER_INFO_SAVED"
		}));
	}
}	