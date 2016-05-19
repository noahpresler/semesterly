import fetch from 'isomorphic-fetch';
import { getUserInfoEndpoint, getSaveTimetableEndpoint, getSaveSettingsEndpoint } from '../constants.jsx';
import { store } from '../init.jsx';
import { loadTimetable, fetchClassmates } from './timetable_actions.jsx';

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
			.then(user => {
				dispatch(getUserInfo(user));
				if (user.timetables && user.timetables.length > 0) {
					// loading one of the user's timetables (after initial page load)
					loadTimetable(user.timetables[0]);
					dispatch({type: "RECEIVE_TIMETABLE_SAVED"});
				}
				return user;
			})
			.then(user => {
				if (user.isLoggedIn && user.timetables[0]) {
					dispatch(fetchClassmates(user.timetables[0].courses.map( c => c['id'])))
				}
			});
	}
}

function getSaveTimetablesRequestBody() {
	let state = store.getState();
	let timetableState = state.timetables;
	let semester = state.semester
	let name = state.savingTimetable.activeTimetable.name;
	let id = state.savingTimetable.activeTimetable.id || 0;
	return {
		timetable: timetableState.items[timetableState.active],
		semester,
		name,
		id,
	}
}

/* Returns the currently active timetable */
function getActiveTimetable(timetableState) {
	return timetableState.items[timetableState.active];
}
/* Returns the currently active timetable */
export function lockActiveSections(activeTimetable) {
	let courseSections = {};
	let courses = activeTimetable.courses;
	for (let i = 0; i < courses.length; i++) {
		let course = courses[i];
		let slots = course.slots;
		courseSections[course.id] = {}
		for (let j = 0; j < slots.length; j++) {
			let slot = slots[j];
			courseSections[course.id][slot.section_type] = slot.meeting_section
		}
	}
	return courseSections;
}
export function saveTimetable() {
	return (dispatch) => {
		let state = store.getState();
		if (!state.userInfo.data.isLoggedIn) {
			return dispatch({type: 'TOGGLE_SIGNUP_MODAL'})
		}
		let activeTimetable = getActiveTimetable(state.timetables);
		// current timetable is empty or we're already in saved state, don't save this timetable
		if (activeTimetable.courses.length === 0 || state.savingTimetable.upToDate) {
			return;
		}
		// mark that we're now trying to save this timetable
		dispatch({
			type: "REQUEST_SAVE_TIMETABLE"
		});
		// mark that the current timetable is now the only available one
		dispatch({
			type: "RECEIVE_TIMETABLES",
			timetables: [activeTimetable],
			preset: true,
			saving: true
		});
		// edit the state's courseSections, so that future requests to add/remove/unlock
		// courses are handled correctly. in the new courseSections, every currently active
		// section will be locked
		dispatch({
			type: "RECEIVE_COURSE_SECTIONS",
			courseSections: lockActiveSections(activeTimetable)
		});
		fetch(getSaveTimetableEndpoint(), {
			method: 'POST',
			body: JSON.stringify(getSaveTimetablesRequestBody()),
			credentials: 'include',
		})
		.then(response => response.json())
		.then(json => {
			if (json.error) {
				dispatch({
					type: "ALERT_TIMETABLE_EXISTS"
				});
			}
			else {
				dispatch({
					type: "CHANGE_ACTIVE_SAVED_TIMETABLE",
					timetable: json.saved_timetable
				});
				dispatch({
					type: "RECEIVE_SAVED_TIMETABLES",
					timetables: json.timetables
				});
			}
			dispatch({
				type: "RECEIVE_TIMETABLE_SAVED"
			});
			return json;
		})
		.then(json => {
			if (!json.error && state.userInfo.data.isLoggedIn && json.timetables[0]) {
				dispatch(fetchClassmates(json.timetables[0].courses.map( c => c['id'])))
			}
		});
	}
}

function getSaveSettingsRequestBody() {
	return {
		userInfo: store.getState().userInfo.data
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
