import fetch from 'isomorphic-fetch';
import { getUserInfoEndpoint, getSaveTimetableEndpoint, getSaveSettingsEndpoint, getClassmatesEndpoint, getLoadSavedTimetablesEndpoint } from '../constants.jsx';
import { store } from '../init.jsx';
import { loadTimetable, nullifyTimetable } from './timetable_actions.jsx';
import { browserSupportsLocalStorage } from '../util.jsx';

let autoSaveTimer;

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

export function getClassmates(json) {
	return {
		type: "CLASSMATES_RECEIVED",
		courses: json
	};
}

export function requestClassmates() {
  return {
    type: "REQUEST_CLASSMATES",
  }
}

function getSaveTimetablesRequestBody() {
	let state = store.getState();
	let timetableState = state.timetables;
	let semester = state.semester;
	let name = state.savingTimetable.activeTimetable.name;
	let id = state.savingTimetable.activeTimetable.id || 0;
	return {
		timetable: getActiveTimetable(timetableState),
		semester,
		name,
		id,
	}
}

/* Returns the currently active timetable */
export function getActiveTimetable(timetableState) {
	return timetableState.items[timetableState.active];
}
/* Returns the updated courseSections, after locking all sections */
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
export function saveTimetable(isAutoSave=false) {
	return (dispatch) => {
		let state = store.getState();
		if (!state.userInfo.data.isLoggedIn) {
			return dispatch({type: 'TOGGLE_SIGNUP_MODAL'})
		}
		let activeTimetable = getActiveTimetable(state.timetables);
		// if current timetable is empty or we're already in saved state, don't save this timetable
		if (activeTimetable.courses.length === 0 || state.savingTimetable.upToDate) {
			return;
		}
		// mark that we're now trying to save this timetable
		dispatch({
			type: "REQUEST_SAVE_TIMETABLE"
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
				// edit the state's courseSections, so that future requests to add/remove/unlock
				// courses are handled correctly. in the new courseSections, every currently active
				// section will be locked
				if (!isAutoSave) {
					// mark that the current timetable is now the only available one (since all sections are locked)
					dispatch({
						type: "RECEIVE_TIMETABLES",
						timetables: [activeTimetable],
						preset: true,
						saving: true
					});
					dispatch({
						type: "RECEIVE_COURSE_SECTIONS",
						courseSections: lockActiveSections(activeTimetable)
					});
				}
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
				type: "RECEIVE_TIMETABLE_SAVED",
				upToDate: !json.error
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

export function getUserSavedTimetables(semester) {
	return (dispatch) => {
		dispatch({
			type: "REQUEST_SAVE_USER_INFO"
		});
		fetch(getLoadSavedTimetablesEndpoint(semester), {
			credentials: 'include',
		})
		.then(response => response.json())
		.then(timetables => {
				dispatch({
				type: "RECEIVE_SAVED_TIMETABLES",
				timetables,
			});
			if (timetables[0]) {
				loadTimetable(timetables[0]);
			}
			else {
				nullifyTimetable(dispatch);
			}
		})

	}
}

export function fetchClassmates(courses) {
	return (dispatch) => {

		dispatch(requestClassmates());
		fetch(getClassmatesEndpoint(), {
			credentials: 'include',
			method: 'POST',
			body: JSON.stringify({ course_ids: courses })
		})
	    .then(response => response.json())
	    .then(json => {
	    	dispatch(getClassmates(json))
	    });
	}
}

export function autoSave(delay=4000) {
	let state = store.getState();
	clearTimeout(autoSaveTimer)
	autoSaveTimer = setTimeout(() => {
		if (state.userInfo.data.isLoggedIn && state.timetables.items[state.timetables.active].courses.length > 0)
			store.dispatch(saveTimetable(true))
	}, delay);
}