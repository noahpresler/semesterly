import fetch from 'isomorphic-fetch';
import { getUserInfoEndpoint,
	getSaveTimetableEndpoint,
	getCloneTimetableEndpoint,
	getDeleteTimetableEndpoint,
	getSaveSettingsEndpoint,
	getClassmatesEndpoint,
	getLoadSavedTimetablesEndpoint,
	getSetRegistrationTokenEndpoint,
	deleteRegistrationTokenEndpoint,
	getFriendsEndpoint,
	getIntegrationGetEndpoint,
	getIntegrationDelEndpoint,
	getIntegrationAddEndpoint,
	getMostClassmatesCountEndpoint } from '../constants.jsx';
import { store } from '../init.jsx';
import { loadTimetable, nullifyTimetable, getNumberedName } from './timetable_actions.jsx';
import { browserSupportsLocalStorage, setDeclinedNotifications } from '../util.jsx';

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

export function getFriends(json) {
	return {
		type: "FRIENDS_RECEIVED",
		peers: json
	};
}

export function requestClassmates() {
  return {
    type: "REQUEST_CLASSMATES",
  }
}

export function requestFriends() {
  return {
    type: "REQUEST_FRIENDS",
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
export function saveTimetable(isAutoSave=false, callback=null) {
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
			if (callback) {
				callback();
				return;
			}
			if (!json.error && state.userInfo.data.isLoggedIn && json.timetables[0]) {
				dispatch(fetchClassmates(json.timetables[0].courses.map( c => c['id'])))
			}
		});
	}
}

export function duplicateTimetable(timetable) {
	return (dispatch) => {
		let state = store.getState();
		if (!state.userInfo.data.isLoggedIn) {
			return dispatch({type: 'TOGGLE_SIGNUP_MODAL'})
		}
		// mark that we're now trying to save this timetable
		dispatch({
			type: "REQUEST_SAVE_TIMETABLE"
		});
		fetch(getCloneTimetableEndpoint(), {
			method: 'POST',
			body: JSON.stringify({
				timetable: timetable,
				name: getNumberedName(timetable.name)
			}),
			credentials: 'include',
		})
		.then(response => response.json())
		.then(json => {
			dispatch({
				type: "RECEIVE_TIMETABLES",
				timetables: [json.saved_timetable],
				preset: true,
				saving: true
			});
			dispatch({
				type: "RECEIVE_COURSE_SECTIONS",
				courseSections: lockActiveSections(json.saved_timetable)
			});
			dispatch({
				type: "CHANGE_ACTIVE_SAVED_TIMETABLE",
				timetable: json.saved_timetable
			});
			dispatch({
				type: "RECEIVE_SAVED_TIMETABLES",
				timetables: json.timetables
			});
			dispatch({
				type: "RECEIVE_TIMETABLE_SAVED",
				upToDate: true
			});

			return json;
		})
		.then(json => {
			if (state.userInfo.data.isLoggedIn && json.timetables[0]) {
				dispatch(fetchClassmates(json.timetables[0].courses.map( c => c['id'])))
			}
		});
	}
}


export function deleteTimetable(timetable) {
	return (dispatch) => {
		let state = store.getState();
		if (!state.userInfo.data.isLoggedIn) {
			return dispatch({type: 'TOGGLE_SIGNUP_MODAL'})
		}
		// mark that we're now trying to save this timetable
		dispatch({
			type: "REQUEST_SAVE_TIMETABLE"
		});
		fetch(getDeleteTimetableEndpoint(), {
			method: 'POST',
			body: JSON.stringify(timetable),
			credentials: 'include',
		})
		.then(response => response.json())
		.then(json => {
			dispatch({
				type: "RECEIVE_SAVED_TIMETABLES",
				timetables: json.timetables
			});
			if (json.timetables.length > 0) {
				dispatch({
					type: "RECEIVE_TIMETABLES",
					timetables: [json.timetables[0]],
					preset: true,
					saving: true
				});
				dispatch({
					type: "RECEIVE_COURSE_SECTIONS",
					courseSections: lockActiveSections(json.timetables[0])
				});
				dispatch({
					type: "CHANGE_ACTIVE_SAVED_TIMETABLE",
					timetable: json.timetables[0]
				});
				dispatch({
					type: "RECEIVE_SAVED_TIMETABLES",
					timetables: json.timetables
				});
				dispatch({
					type: "RECEIVE_TIMETABLE_SAVED",
					upToDate: true
				});
			} else { 
				nullifyTimetable(dispatch);
			}
			return json;
		})
		.then(json => {
			if (state.userInfo.data.isLoggedIn && json.timetables[0]) {
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

export function saveSettings(callback) {
	return (dispatch) => {
		dispatch({
			type: "REQUEST_SAVE_USER_INFO"
		});
		fetch(getSaveSettingsEndpoint(), {
			method: 'POST',
			body: JSON.stringify(getSaveSettingsRequestBody()),
			credentials: 'include',
		})
		.then(response => {
			let state = store.getState();
			
			console.log(state.userInfo.data.social_courses);

			let timetables = state.timetables.items;
			let active = state.timetables.active;
			let active_tt = timetables[active];

			if (state.userInfo.data.social_courses) {
				dispatch(fetchClassmates(active_tt.courses.map( c => c['id'])));
			}
			dispatch({
				type: "RECEIVE_USER_INFO_SAVED"
			})
			return response;
		})
		.then(response => {
				if(callback){callback()}
		});
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
	console.log("in fetch class");
	console.log(courses);
	return (dispatch) => 
{		let state = store.getState();
		let semester = state.semester !== undefined ? state.semester : currentSemester;
		dispatch(requestClassmates());
		fetch(getClassmatesEndpoint(), {
			credentials: 'include',
			method: 'POST',
			body: JSON.stringify({ course_ids: courses, semester: semester })
		})
	    .then(response => response.json())
	    .then(json => {
	    	dispatch(getClassmates(json))
	    });
	}
}

export function fetchFriends() {
	let state = store.getState();
	let semester = state.semester !== undefined ? state.semester : currentSemester;
	return (dispatch) => {
		dispatch(requestFriends());
		fetch(getFriendsEndpoint(), {
			credentials: 'include',
			method: 'POST',
			body: JSON.stringify({ semester: semester })
		})
	    .then(response => response.json())
	    .then(json => {
	    	dispatch(getFriends(json))
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

export function setARegistrationToken() {
	if ('serviceWorker' in navigator) {
	    navigator.serviceWorker.register('/sw.js').then(function(reg) {
	        reg.pushManager.subscribe({
	            userVisibleOnly: true
	        }).then(function(sub) {
	        	// console.log(sub);
	            sendRegistrationToken(sub.toJSON());
	        });
	    }).catch(function(error) {
	        // console.log(':^(', error);
	    });
	}
}

export function isRegistered() {
	if ('serviceWorker' in navigator) {
	    navigator.serviceWorker.register('/sw.js').then(function(reg) {
			return reg.pushManager.getSubscription().then(function(sub) {
				if (!sub) {
					return;
				} else {
					store.dispatch({
			        	type: "TOKEN_REGISTERED"
		        	});
					return true;
				}
			})
	    }).catch(function(error) {
	        // console.log(':^(', error);
	    });
	}
}

export function sendRegistrationToken(token) {
	return fetch(getSetRegistrationTokenEndpoint(), {
		method: 'POST',
		body: JSON.stringify({
			token
		}),
		credentials: 'include',
	})
    .then(response => response.json()) // TODO(rohan): error-check the response
    .then(json => {
    	if (!json.error) {
	      	store.dispatch({
	        	type: "TOKEN_REGISTERED"
        	});
    	}
	});
}

export function unregisterAToken() {
    if ('serviceWorker' in navigator) {
	    navigator.serviceWorker.register('/sw.js').then(function(reg) {
	        reg.pushManager.subscribe({
	            userVisibleOnly: true
	        }).then(function(sub) {
	        	// TODO: unregister token on client side
	            sendRegistrationTokenForDeletion(sub.toJSON())
	        });
	    }).catch(function(error) {
	        // console.log(':^(', error);
	    });
	}
}

export function sendRegistrationTokenForDeletion(token) {
    return fetch(deleteRegistrationTokenEndpoint(), {
        method: 'POST',
        body: JSON.stringify({
            token
        }),
        credentials: 'include',
    })
    .then(response => response.json()) // TODO(rohan): error-check the response
    .then(json => {
        if (!json.error) {
            // console.log("token deleted: " + token);
            store.dispatch({
                type: "UNREGISTER_TOKEN"
            });
        } else {
            // console.log("token not deleted: " + token);
        }
    });
}

export function openIntegrationModal(integrationID, courseID) {
	return fetch(getIntegrationGetEndpoint(integrationID, courseID), {
			credentials: 'include',
			method: 'GET'
		})
		.then(response => response.json())
		.then(json => {
			store.dispatch({
				type: 'OPEN_INTEGRATION_MODAL',
				enabled: json['integration_enabled'],
				id: courseID,
				integration_id: integrationID
			})
		});
}

export function delIntegration(integrationID, courseID) {
	return fetch(getIntegrationDelEndpoint(integrationID, courseID), {
			credentials: 'include',
			method: 'GET'
		})
		.then(response => response.json());
}

export function addIntegration(integrationID, courseID, json) {
	return fetch(getIntegrationAddEndpoint(integrationID, courseID), {
			credentials: 'include',
			method: 'POST',
			body: JSON.stringify({ json: json })
		})
		.then(response => response.json());
}

export function createiCal(timetable) {
	console.log(timetable)
}

export function requestMostClassmates() {
  return {
    type: "REQUEST_MOST_CLASSMATES",
  }
}

export function fetchMostClassmatesCount(courses) {
  return (dispatch) => 
{   let state = store.getState();
    let semester = state.semester !== undefined ? state.semester : currentSemester;
    dispatch(requestMostClassmates());
    fetch(getMostClassmatesCountEndpoint(), {
      credentials: 'include',
      method: 'POST',
      body: JSON.stringify({ course_ids: courses, semester: semester })
    })
      .then(response => response.json())
      .then(json => {
      	dispatch({
			type: "CHANGE_MOST_FRIENDS_CLASS",
			classId: json.id,
			count: json.count
		});
		// dispatch({
		// 	type: "ALERT_FACEBOOK_FRIENDS",
		// });
      });
  }
}
