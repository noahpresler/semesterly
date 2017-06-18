import fetch from 'isomorphic-fetch';
import Cookie from 'js-cookie';
import {
    deleteRegistrationTokenEndpoint,
    getClassmatesEndpoint,
    getDeleteTimetableEndpoint,
    getFinalExamSchedulerEndpoint,
    getFriendsEndpoint,
    getIntegrationEndpoint,
    getLoadSavedTimetablesEndpoint,
    getLogFacebookAlertClickEndpoint,
    getLogFacebookAlertViewEndpoint,
    getMostClassmatesCountEndpoint,
    getSaveSettingsEndpoint,
    getSaveTimetableEndpoint,
    getSetRegistrationTokenEndpoint,
    acceptTOSEndpoint,
} from '../constants/endpoints';
import { getActiveTT, getCurrentSemester } from '../reducers/root_reducer';
import { fetchCourseClassmates } from './modal_actions';
import { getNumberedName, loadTimetable, nullifyTimetable } from './timetable_actions';
import { MAX_TIMETABLE_NAME_LENGTH } from '../constants/constants';
import * as ActionTypes from '../constants/actionTypes';
import { setTimeShownBanner, checkStatus } from '../util';

let autoSaveTimer;

export const requestUserInfo = () => ({
  type: ActionTypes.REQUEST_USER_INFO,
});

export const getClassmates = json => dispatch => (
  dispatch({
    type: ActionTypes.CLASSMATES_RECEIVED,
    courses: json,
  })
);

export const getFriends = json => ({
  type: ActionTypes.FRIENDS_RECEIVED,
  peers: json,
});

export const requestClassmates = () => ({
  type: ActionTypes.REQUEST_CLASSMATES,
});

export const requestFriends = () => ({
  type: ActionTypes.REQUEST_FRIENDS,
});

/* Returns the currently active timetable */
export const getActiveTimetable = timetableState => timetableState.items[timetableState.active];

const getSaveTimetablesRequestBody = (state) => {
  const timetableState = state.timetables;
  const tt = getActiveTimetable(timetableState);
  return {
    courses: tt.courses,
    events: state.customSlots,
    has_conflict: tt.has_conflict,
    semester: getCurrentSemester(state),
    name: state.savingTimetable.activeTimetable.name,
    id: state.savingTimetable.activeTimetable.id,
  };
};

/* Returns the updated courseSections, after locking all sections */
export const lockActiveSections = (activeTimetable) => {
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
};

export const requestMostClassmates = () => ({
  type: ActionTypes.REQUEST_MOST_CLASSMATES,
});

export const fetchMostClassmatesCount = courses => (dispatch, getState) => {
  const state = getState();
  if (!state.userInfo.data.social_courses) {
    return;
  }
  const semester = getCurrentSemester(state);
  dispatch(requestMostClassmates());
  fetch(getMostClassmatesCountEndpoint(semester, courses), {
    credentials: 'include',
    method: 'GET',
  })
      .then(response => response.json())
      .then((json) => {
        dispatch({
          type: ActionTypes.CHANGE_MOST_FRIENDS_CLASS,
          classId: json.id,
          count: json.count,
          total: json.total_count,
        });
      });
};

export const fetchClassmates = courses => (dispatch, getState) => {
  const state = getState();
  if (!state.userInfo.data.social_courses) {
    return;
  }
  setTimeout(() => {
    dispatch(fetchMostClassmatesCount(getActiveTimetable(state.timetables)
      .courses.map(c => c.id)));
  }, 500);
  dispatch(requestClassmates());
  fetch(getClassmatesEndpoint(getCurrentSemester(state), courses), {
    credentials: 'include',
    method: 'GET',
  })
    .then(response => response.json())
    .then((json) => {
      dispatch(getClassmates(json));
    });
};

export const saveTimetable = (isAutoSave = false, callback = null) => (dispatch, getState) => {
  const state = getState();
  if (!state.userInfo.data.isLoggedIn) {
    return dispatch({ type: ActionTypes.TOGGLE_SIGNUP_MODAL });
  }
  const activeTimetable = getActiveTimetable(state.timetables);

  // if current timetable is empty or we're already in saved state, don't save this timetable
  const numSlots = activeTimetable.courses.length + state.customSlots.length;
  if (numSlots === 0 || state.savingTimetable.upToDate) {
    return null;
  }

  // mark that we're now trying to save this timetable
  dispatch({
    type: ActionTypes.REQUEST_SAVE_TIMETABLE,
  });

  const body = getSaveTimetablesRequestBody(state);
  return fetch(getSaveTimetableEndpoint(), {
    headers: {
      'X-CSRFToken': Cookie.get('csrftoken'),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(body),
    credentials: 'include',
  })
    .then(checkStatus)
    .then(response => response.json())
    .then((json) => {
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
      if (callback !== null) {
        callback();
      }
      if (!json.error && state.userInfo.data.isLoggedIn && json.timetables[0]) {
        return dispatch(fetchClassmates(json.timetables[0].courses.map(c => c.id)));
      }
      return null;
    })
    .catch((error) => {
      if (error.response && error.response.status === 409) {
        dispatch({
          type: ActionTypes.ALERT_TIMETABLE_EXISTS,
        });
      }
      return null;
    });
};

export const duplicateTimetable = timetable => (dispatch, getState) => {
  const state = getState();
  if (!state.userInfo.data.isLoggedIn) {
    dispatch({ type: ActionTypes.TOGGLE_SIGNUP_MODAL });
  }
  // mark that we're now trying to save this timetable
  dispatch({
    type: ActionTypes.REQUEST_SAVE_TIMETABLE,
  });

  fetch(getSaveTimetableEndpoint(), {
    headers: {
      'X-CSRFToken': Cookie.get('csrftoken'),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      semester: getCurrentSemester(state),
      source: timetable.name,
      name: getNumberedName(timetable.name, state.userInfo.data.timetables),
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


export const deleteTimetable = timetable => (dispatch, getState) => {
  const state = getState();
  if (!state.userInfo.data.isLoggedIn) {
    dispatch({ type: ActionTypes.TOGGLE_SIGNUP_MODAL });
  }
    // mark that we're now trying to save this timetable
  dispatch({
    type: ActionTypes.REQUEST_SAVE_TIMETABLE,
  });
  fetch(getDeleteTimetableEndpoint(getCurrentSemester(state), timetable.name), {
    headers: {
      'X-CSRFToken': Cookie.get('csrftoken'),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'DELETE',
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

export const saveSettings = callback => (dispatch, getState) => {
  dispatch({
    type: ActionTypes.REQUEST_SAVE_USER_INFO,
  });
  fetch(getSaveSettingsEndpoint(), {
    headers: {
      'X-CSRFToken': Cookie.get('csrftoken'),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'PATCH',
    body: JSON.stringify(getState().userInfo.data),
    credentials: 'include',
  })
    .then((response) => {
      const state = getState();
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

export const getUserSavedTimetables = semester => (dispatch) => {
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

export const fetchFinalExamSchedule = () => (dispatch, getState) => {
  const state = getState();
  const timetable = getActiveTimetable(state.timetables);
  dispatch({ type: ActionTypes.FETCH_FINAL_EXAMS });
  fetch(getFinalExamSchedulerEndpoint(), {
    headers: {
      'X-CSRFToken': Cookie.get('csrftoken'),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    method: 'POST',
    body: JSON.stringify(timetable),
  })
    .then(response => response.json())
    .then((json) => {
      dispatch({ type: ActionTypes.RECEIVE_FINAL_EXAMS, json });
    });
};

export const fetchFriends = () => (dispatch, getState) => {
  const state = getState();
  if (!state.userInfo.data.social_courses) {
    return;
  }
  dispatch(requestFriends());
  dispatch({
    type: ActionTypes.PEER_MODAL_LOADING,
  });
  fetch(getFriendsEndpoint(getCurrentSemester(state)), {
    credentials: 'include',
    method: 'GET',
  })
    .then(response => response.json())
    .then((json) => {
      dispatch(getFriends(json));
      dispatch({
        type: ActionTypes.PEER_MODAL_LOADED,
      });
    });
};

export const autoSave = (delay = 2000) => (dispatch, getState) => {
  const state = getState();
  clearTimeout(autoSaveTimer);
  const numTimetables = getActiveTT(state).courses.length;
  const numEvents = state.customSlots.length;
  autoSaveTimer = setTimeout(() => {
    if (state.userInfo.data.isLoggedIn && numTimetables + numEvents > 0) {
      dispatch(saveTimetable(true));
    }
  }, delay);
};

export const sendRegistrationToken = token => (dispatch) => {
  fetch(getSetRegistrationTokenEndpoint(), {
    headers: {
      'X-CSRFToken': Cookie.get('csrftoken'),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      token,
    }),
    credentials: 'include',
  })
    .then((response) => {
      if (response.status === 201) {
        dispatch({
          type: ActionTypes.TOKEN_REGISTERED,
        });
      }
    });
};

export const setARegistrationToken = () => (dispatch) => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      reg.pushManager.subscribe({
        userVisibleOnly: true,
      }).then((sub) => {
        dispatch(sendRegistrationToken(sub.toJSON()));
      });
    }).catch(() => {
    });
  }
};

export const isRegistered = () => (dispatch) => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => reg.pushManager.getSubscription().then((sub) => {
        if (sub) {
          dispatch({
            type: ActionTypes.TOKEN_REGISTERED,
          });
          return true;
        }
        return null;
      })).catch(() => null);
  }
};

export const sendRegistrationTokenForDeletion = token => (dispatch) => {
  fetch(deleteRegistrationTokenEndpoint(token.endpoint), {
    headers: {
      'X-CSRFToken': Cookie.get('csrftoken'),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'DELETE',
    credentials: 'include',
  })
    .then((response) => {
      if (response.status === 204) {
        dispatch({
          type: ActionTypes.UNREGISTER_TOKEN,
        });
      }
    });
};

export const unRegisterAToken = () => (dispatch) => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      reg.pushManager.subscribe({
        userVisibleOnly: true,
      }).then((sub) => {
        dispatch(sendRegistrationTokenForDeletion(sub.toJSON()));
      });
    }).catch(() => {
    });
  }
};

export const openIntegrationModal = (integrationID, courseID) => (dispatch) => {
  fetch(getIntegrationEndpoint(integrationID, courseID), {
    credentials: 'include',
    method: 'GET',
  })
    .then((response) => {
      dispatch({
        type: ActionTypes.OPEN_INTEGRATION_MODAL,
        enabled: response.status === 200,
        id: courseID,
        integration_id: integrationID,
      });
    });
};

export const delIntegration = (integrationID, courseID) => {
  fetch(getIntegrationEndpoint(integrationID, courseID), {
    headers: {
      'X-CSRFToken': Cookie.get('csrftoken'),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    method: 'DELETE',
  });
};

export const addIntegration = (integrationID, courseID, json) => {
  fetch(getIntegrationEndpoint(integrationID, courseID), {
    headers: {
      'X-CSRFToken': Cookie.get('csrftoken'),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    method: 'POST',
    body: JSON.stringify({ json }),
  });
};

export const logFacebookAlertView = () => {
  fetch(getLogFacebookAlertViewEndpoint(), {
    method: 'POST',
    credentials: 'include',
  });
};

export const LogFacebookAlertClick = () => {
  fetch(getLogFacebookAlertClickEndpoint(), {
    method: 'POST',
    credentials: 'include',
  });
};

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

export const acceptTOS = () => {
  fetch(acceptTOSEndpoint(), {
    headers: {
      'X-CSRFToken': Cookie.get('csrftoken'),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    method: 'POST',
    body: '',
  });
};

// Show the TOS and privacy policy agreement if the user has not seen the latest version.
// The modal is used for logged in users and the banner is used for anonymous users.
export const handleAgreement = (currentUser, timeUpdatedTos) => (dispatch) => {
  if (currentUser.isLoggedIn) {
    const timeAcceptedTos = currentUser.timeAcceptedTos;
    if (timeAcceptedTos === null || Date.parse(timeAcceptedTos) < timeUpdatedTos) {
      dispatch({ type: ActionTypes.TRIGGER_TOS_MODAL });
    }
  } else {
    const timeShownBanner = localStorage.getItem('timeShownBanner');
    if (timeShownBanner === null || timeShownBanner < timeUpdatedTos) {
      setTimeShownBanner(Date.now());
      dispatch({ type: ActionTypes.TRIGGER_TOS_BANNER });
    }
  }
};
