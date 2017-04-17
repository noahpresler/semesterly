import fetch from 'isomorphic-fetch';
import {
    deleteRegistrationTokenEndpoint,
    getClassmatesEndpoint,
    getCloneTimetableEndpoint,
    getDeleteTimetableEndpoint,
    getFinalExamSchedulerEndpoint,
    getFriendsEndpoint,
    getIntegrationAddEndpoint,
    getIntegrationDelEndpoint,
    getIntegrationGetEndpoint,
    getLoadSavedTimetablesEndpoint,
    getLogFacebookAlertClickEndpoint,
    getLogFacebookAlertViewEndpoint,
    getMostClassmatesCountEndpoint,
    getSaveSettingsEndpoint,
    getSaveTimetableEndpoint,
    getSetRegistrationTokenEndpoint,
} from '../constants/endpoints';
import { fetchCourseClassmates } from './modal_actions';
import { store } from '../init';
import { getNumberedName, loadTimetable, nullifyTimetable } from './timetable_actions';
import { MAX_TIMETABLE_NAME_LENGTH } from '../constants/constants';
import * as ActionTypes from '../constants/actionTypes';

let autoSaveTimer;

export function getUserInfo(json) {
  return {
    type: ActionTypes.USER_INFO_RECEIVED,
    data: json,
  };
}

export function requestUserInfo() {
  return {
    type: ActionTypes.REQUEST_USER_INFO,
  };
}

export function getClassmates(json) {
  return {
    type: ActionTypes.CLASSMATES_RECEIVED,
    courses: json,
  };
}

export function getFriends(json) {
  return {
    type: ActionTypes.FRIENDS_RECEIVED,
    peers: json,
  };
}

export function requestClassmates() {
  return {
    type: ActionTypes.REQUEST_CLASSMATES,
  };
}

export function requestFriends() {
  return {
    type: ActionTypes.REQUEST_FRIENDS,
  };
}

/* Returns the currently active timetable */
export function getActiveTimetable(timetableState) {
  return timetableState.items[timetableState.active];
}

function getSaveTimetablesRequestBody() {
  const state = store.getState();
  const timetableState = state.timetables;
  const name = state.savingTimetable.activeTimetable.name;
  const id = state.savingTimetable.activeTimetable.id || 0;
  return {
    timetable: getActiveTimetable(timetableState),
    semester: allSemesters[state.semesterIndex],
    name,
    id,
  };
}

/* Returns the updated courseSections, after locking all sections */
export function lockActiveSections(activeTimetable) {
  const courseSections = {};
  const courses = activeTimetable.courses;
  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    const slots = course.slots;
    courseSections[course.id] = {};
    for (let j = 0; j < slots.length; j++) {
      const slot = slots[j];
      courseSections[course.id][slot.section_type] = slot.meeting_section;
    }
  }
  return courseSections;
}

export function requestMostClassmates() {
  return {
    type: ActionTypes.REQUEST_MOST_CLASSMATES,
  };
}

export function fetchMostClassmatesCount(courses) {
  return (dispatch) => {
    const state = store.getState();
    const semesterIndex = state.semesterIndex !== undefined ? state.semesterIndex : currentSemester;
    const semester = allSemesters[semesterIndex];
    dispatch(requestMostClassmates());
    fetch(getMostClassmatesCountEndpoint(), {
      credentials: 'include',
      method: 'POST',
      body: JSON.stringify({ course_ids: courses, semester }),
    })
      .then(response => response.json())
      .then((json) => {
        dispatch({
          type: ActionTypes.CHANGE_MOST_FRIENDS_CLASS,
          classId: json.id,
          count: json.count,
          total: json.total_count,
        });
        // dispatch({
        // type: ActionTypes.ALERT_FACEBOOK_FRIENDS,
        // });
      });
  };
}

export function fetchClassmates(courses) {
  return (dispatch) => {
    const state = store.getState();
    const semesterIndex = state.semesterIndex !== undefined ? state.semesterIndex : currentSemester;

    setTimeout(() => {
      dispatch(fetchMostClassmatesCount(getActiveTimetable(state.timetables)
        .courses.map(c => c.id)));
    }, 500);
    dispatch(requestClassmates());
    fetch(getClassmatesEndpoint(), {
      credentials: 'include',
      method: 'POST',
      body: JSON.stringify({ course_ids: courses, semester: allSemesters[semesterIndex] }),
    })
      .then(response => response.json())
      .then((json) => {
        dispatch(getClassmates(json));
      });
  };
}

export const saveTimetable = (isAutoSave = false, callback = null) => (dispatch) => {
  const state = store.getState();
  if (!state.userInfo.data.isLoggedIn) {
    return dispatch({ type: ActionTypes.TOGGLE_SIGNUP_MODAL });
  }
  const activeTimetable = getActiveTimetable(state.timetables);

  // if current timetable is empty or we're already in saved state, don't save this timetable
  if (activeTimetable.courses.length === 0 || state.savingTimetable.upToDate) {
    return null;
  }

  // mark that we're now trying to save this timetable
  dispatch({
    type: ActionTypes.REQUEST_SAVE_TIMETABLE,
  });

  fetch(getSaveTimetableEndpoint(), {
    method: 'POST',
    body: JSON.stringify(getSaveTimetablesRequestBody()),
    credentials: 'include',
  })
  .then(response => response.json())
  .then((json) => {
    if (json.error) {
      dispatch({
        type: ActionTypes.ALERT_TIMETABLE_EXISTS,
      });
      return null;
    }
    // edit the state's courseSections, so that future requests to add/remove/unlock
    // courses are handled correctly. in the new courseSections, every currently
    // active section will be locked
    if (!isAutoSave) {
      // mark that the current timetable is now the only available one (since all
      // sections are locked)
      dispatch({
        type: ActionTypes.RECEIVE_TIMETABLES,
        timetables: [activeTimetable],
        preset: true,
        saving: true,
      });
      dispatch({
        type: ActionTypes.RECEIVE_COURSE_SECTIONS,
        courseSections: lockActiveSections(activeTimetable),
      });
    }
    dispatch({
      type: ActionTypes.CHANGE_ACTIVE_SAVED_TIMETABLE,
      timetable: json.saved_timetable,
    });
    dispatch({
      type: ActionTypes.RECEIVE_SAVED_TIMETABLES,
      timetables: json.timetables,
    });
    dispatch({
      type: ActionTypes.RECEIVE_TIMETABLE_SAVED,
      upToDate: !json.error,
    });
    return json;
  })
  .then((json) => {
    if (callback) {
      callback();
    }
    if (!json.error && state.userInfo.data.isLoggedIn && json.timetables[0]) {
      return dispatch(fetchClassmates(json.timetables[0].courses.map(c => c.id)));
    }
    return null;
  });
  return null;
};

export const duplicateTimetable = timetable => (dispatch) => {
  const state = store.getState();
  if (!state.userInfo.data.isLoggedIn) {
    dispatch({ type: ActionTypes.TOGGLE_SIGNUP_MODAL });
  }
  // mark that we're now trying to save this timetable
  dispatch({
    type: ActionTypes.REQUEST_SAVE_TIMETABLE,
  });

  fetch(getCloneTimetableEndpoint(), {
    method: 'POST',
    body: JSON.stringify({
      timetable,
      name: getNumberedName(timetable.name),
    }),
    credentials: 'include',
  })
  .then(response => response.json())
  .then((json) => {
    dispatch({
      type: ActionTypes.RECEIVE_TIMETABLES,
      timetables: [json.saved_timetable],
      preset: true,
      saving: true,
    });
    dispatch({
      type: ActionTypes.RECEIVE_COURSE_SECTIONS,
      courseSections: lockActiveSections(json.saved_timetable),
    });
    dispatch({
      type: ActionTypes.CHANGE_ACTIVE_SAVED_TIMETABLE,
      timetable: json.saved_timetable,
    });
    dispatch({
      type: ActionTypes.RECEIVE_SAVED_TIMETABLES,
      timetables: json.timetables,
    });
    dispatch({
      type: ActionTypes.RECEIVE_TIMETABLE_SAVED,
      upToDate: true,
    });

    return json;
  })
  .then((json) => {
    if (state.userInfo.data.isLoggedIn && json.timetables[0]) {
      return dispatch(fetchClassmates(json.timetables[0].courses.map(c => c.id)));
    }
    return null;
  });
};


export const deleteTimetable = timetable => (dispatch) => {
  const state = store.getState();
  if (!state.userInfo.data.isLoggedIn) {
    dispatch({ type: ActionTypes.TOGGLE_SIGNUP_MODAL });
  }
    // mark that we're now trying to save this timetable
  dispatch({
    type: ActionTypes.REQUEST_SAVE_TIMETABLE,
  });
  fetch(getDeleteTimetableEndpoint(), {
    method: 'POST',
    body: JSON.stringify(timetable),
    credentials: 'include',
  })
        .then(response => response.json())
        .then((json) => {
          dispatch({
            type: ActionTypes.RECEIVE_SAVED_TIMETABLES,
            timetables: json.timetables,
          });
          if (json.timetables.length > 0) {
            dispatch({
              type: ActionTypes.RECEIVE_TIMETABLES,
              timetables: [json.timetables[0]],
              preset: true,
              saving: true,
            });
            dispatch({
              type: ActionTypes.RECEIVE_COURSE_SECTIONS,
              courseSections: lockActiveSections(json.timetables[0]),
            });
            dispatch({
              type: ActionTypes.CHANGE_ACTIVE_SAVED_TIMETABLE,
              timetable: json.timetables[0],
            });
            dispatch({
              type: ActionTypes.RECEIVE_SAVED_TIMETABLES,
              timetables: json.timetables,
            });
            dispatch({
              type: ActionTypes.RECEIVE_TIMETABLE_SAVED,
              upToDate: true,
            });
          } else {
            nullifyTimetable(dispatch);
          }
          return json;
        })
        .then((json) => {
          if (state.userInfo.data.isLoggedIn && json.timetables[0]) {
            dispatch(fetchClassmates(json.timetables[0].courses.map(c => c.id)));
          }
        });
};

function getSaveSettingsRequestBody() {
  return {
    userInfo: store.getState().userInfo.data,
  };
}

export function saveSettings(callback) {
  return (dispatch) => {
    dispatch({
      type: ActionTypes.REQUEST_SAVE_USER_INFO,
    });
    fetch(getSaveSettingsEndpoint(), {
      method: 'POST',
      body: JSON.stringify(getSaveSettingsRequestBody()),
      credentials: 'include',
    })
            .then((response) => {
              const state = store.getState();
              const timetables = state.timetables.items;
              const active = state.timetables.active;
              const activeTT = timetables[active];

              if (state.userInfo.data.social_courses) {
                dispatch(fetchClassmates(activeTT.courses.map(c => c.id)));
                if (state.courseInfo.id) {
                  dispatch(fetchCourseClassmates(state.courseInfo.id));
                }
              }
              dispatch({
                type: ActionTypes.RECEIVE_USER_INFO_SAVED,
              });
              return response;
            })
            .then(() => {
              if (callback) {
                callback();
              }
            });
  };
}

export function getUserSavedTimetables(semester) {
  return (dispatch) => {
    dispatch({
      type: ActionTypes.REQUEST_SAVE_USER_INFO,
    });
    fetch(getLoadSavedTimetablesEndpoint(semester), {
      credentials: 'include',
    })
            .then(response => response.json())
            .then((timetables) => {
              dispatch({
                type: ActionTypes.RECEIVE_SAVED_TIMETABLES,
                timetables,
              });
              if (timetables[0]) {
                dispatch(loadTimetable(timetables[0]));
              } else {
                dispatch(nullifyTimetable(dispatch));
              }
            });
  };
}

export const fetchFinalExamSchedule = () => (dispatch) => {
  const state = store.getState();
  const timetable = getActiveTimetable(state.timetables);
  dispatch({ type: ActionTypes.FETCH_FINAL_EXAMS });
  fetch(getFinalExamSchedulerEndpoint(), {
    credentials: 'include',
    method: 'POST',
    body: JSON.stringify(timetable),
  })
        .then(response => response.json())
        .then((json) => {
          dispatch({ type: ActionTypes.RECIEVE_FINAL_EXAMS, json });
        });
};

export function fetchFriends() {
  const state = store.getState();
  const semesterIndex = state.semesterIndex !== undefined ? state.semesterIndex : currentSemester;
  return (dispatch) => {
    dispatch(requestFriends());
    dispatch({
      type: ActionTypes.PEER_MODAL_LOADING,
    });
    fetch(getFriendsEndpoint(), {
      credentials: 'include',
      method: 'POST',
      body: JSON.stringify({ semester: allSemesters[semesterIndex] }),
    })
            .then(response => response.json())
            .then((json) => {
              dispatch(getFriends(json));
              dispatch({
                type: ActionTypes.PEER_MODAL_LOADED,
              });
            });
  };
}

export function autoSave(delay = 4000) {
  const state = store.getState();
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    if (state.userInfo.data.isLoggedIn
      && state.timetables.items[state.timetables.active].courses.length > 0) {
      store.dispatch(saveTimetable(true));
    }
  }, delay);
}

export function sendRegistrationToken(token) {
  return fetch(getSetRegistrationTokenEndpoint(), {
    method: 'POST',
    body: JSON.stringify({
      token,
    }),
    credentials: 'include',
  })
    .then(response => response.json()) // TODO(rohan): error-check the response
    .then((json) => {
      if (!json.error) {
        store.dispatch({
          type: ActionTypes.TOKEN_REGISTERED,
        });
      }
    });
}

export function setARegistrationToken() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      reg.pushManager.subscribe({
        userVisibleOnly: true,
      }).then((sub) => {
                // console.log(sub);
        sendRegistrationToken(sub.toJSON());
      });
    }).catch(() => {
            // console.log(':^(', error);
    });
  }
}

export function isRegistered() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => reg.pushManager.getSubscription().then((sub) => {
        if (sub) {
          store.dispatch({
            type: ActionTypes.TOKEN_REGISTERED,
          });
          return true;
        }
        return null;
      })).catch(() => null);
  }
}

export function sendRegistrationTokenForDeletion(token) {
  return fetch(deleteRegistrationTokenEndpoint(), {
    method: 'POST',
    body: JSON.stringify({
      token,
    }),
    credentials: 'include',
  })
    .then(response => response.json()) // TODO(rohan): error-check the response
    .then((json) => {
      if (!json.error) {
        // console.log("token deleted: " + token);
        store.dispatch({
          type: ActionTypes.UNREGISTER_TOKEN,
        });
      } else {
        // console.log("token not deleted: " + token);
      }
    });
}

export function unregisterAToken() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      reg.pushManager.subscribe({
        userVisibleOnly: true,
      }).then((sub) => {
                // TODO: unregister token on client side
        sendRegistrationTokenForDeletion(sub.toJSON());
      });
    }).catch(() => {
            // console.log(':^(', error);
    });
  }
}

export function openIntegrationModal(integrationID, courseID) {
  return fetch(getIntegrationGetEndpoint(integrationID, courseID), {
    credentials: 'include',
    method: 'GET',
  })
        .then(response => response.json())
        .then((json) => {
          store.dispatch({
            type: ActionTypes.OPEN_INTEGRATION_MODAL,
            enabled: json.integration_enabled,
            id: courseID,
            integration_id: integrationID,
          });
        });
}

export function delIntegration(integrationID, courseID) {
  return fetch(getIntegrationDelEndpoint(integrationID, courseID), {
    credentials: 'include',
    method: 'GET',
  })
        .then(response => response.json());
}

export function addIntegration(integrationID, courseID, json) {
  return fetch(getIntegrationAddEndpoint(integrationID, courseID), {
    credentials: 'include',
    method: 'POST',
    body: JSON.stringify({ json }),
  })
        .then(response => response.json());
}

export function logFacebookAlertView() {
  fetch(getLogFacebookAlertViewEndpoint(), {
    method: 'POST',
    credentials: 'include',
  });
}

export function LogFacebookAlertClick() {
  fetch(getLogFacebookAlertClickEndpoint(), {
    method: 'POST',
    credentials: 'include',
  });
}

export const changeUserInfo = info => ({
  type: ActionTypes.CHANGE_USER_INFO,
  data: info,
});

export const changeTimetableName = name => (dispatch) => {
  if (name.length === 0 || name.length > MAX_TIMETABLE_NAME_LENGTH) {
    return;
  }
  dispatch({
    type: ActionTypes.CHANGE_ACTIVE_SAVED_TIMETABLE_NAME,
    name,
  });
  dispatch(saveTimetable());
};
