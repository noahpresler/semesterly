/*
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
*/

import fetch from 'isomorphic-fetch';
import Cookie from 'js-cookie';
import uniq from 'lodash/uniq';
import {
    deleteRegistrationTokenEndpoint,
    getClassmatesEndpoint,
    getDeleteTimetableEndpoint,
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
import {
  getActiveTimetable,
  getCurrentSemester } from '../reducers';
import { fetchCourseClassmates } from './modal_actions';
import { getNumberedName, loadTimetable, nullifyTimetable } from './timetable_actions';
import { receiveCourses } from './search_actions';
import { MAX_TIMETABLE_NAME_LENGTH } from '../constants/constants';
import * as ActionTypes from '../constants/actionTypes';
import { setTimeShownBanner, checkStatus, clearLocalTimetable } from '../util';


export const receiveClassmates = json => dispatch => (
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

const getSaveTimetablesRequestBody = (state) => {
  const tt = getActiveTimetable(state);
  // TODO: optional courses?
  return {
    slots: tt.slots,
    events: state.customSlots,
    has_conflict: tt.has_conflict,
    semester: getCurrentSemester(state),
    name: state.savingTimetable.activeTimetable.name,
    id: state.savingTimetable.activeTimetable.id,
  };
};

// returns the course to sections of a timetable
// TODO: when removing course to sections state, this should become the selector
export const lockActiveSections = (timetable) => {
  const courseSections = {};
  timetable.slots.forEach((slot) => {
    if (!(slot.course.id in courseSections)) {
      courseSections[slot.course.id] = {};
    }
    courseSections[slot.course.id][slot.section.section_type] = slot.section.meeting_section;
  });
  return courseSections;
};

export const requestMostClassmates = () => ({
  type: ActionTypes.REQUEST_MOST_CLASSMATES,
});

export const fetchMostClassmatesCount = timetable => (dispatch, getState) => {
  const state = getState();
  const courseIds = uniq(timetable.slots.map(s => s.course));

  if (!state.userInfo.data.social_courses) {
    return;
  }
  const semester = getCurrentSemester(state);
  dispatch(requestMostClassmates());
  fetch(getMostClassmatesCountEndpoint(semester, courseIds), {
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

export const fetchClassmates = timetable => (dispatch, getState) => {
  const state = getState();
  const courseIds = uniq(timetable.slots.map(s => s.course));

  if (!state.userInfo.data.social_courses || courseIds.length === 0) {
    return;
  }
  setTimeout(() => {
    dispatch(fetchMostClassmatesCount(timetable));
  }, 500);
  dispatch(requestClassmates());
  fetch(getClassmatesEndpoint(getCurrentSemester(state), courseIds), {
    credentials: 'include',
    method: 'GET',
  })
    .then(response => response.json())
    .then((json) => {
      dispatch(receiveClassmates(json));
    });
};

export const saveTimetable = (
  isAutoSave = false,
  callback = null,
  autoLockAll = false,
) => (dispatch, getState) => {
  const state = getState();
  if (!state.userInfo.data.isLoggedIn) {
    return dispatch({ type: ActionTypes.TOGGLE_SIGNUP_MODAL });
  }
  const activeTimetable = getActiveTimetable(state);

  // if current timetable is empty or we're already in saved state, don't save this timetable
  const numSlots = activeTimetable.slots.length + state.customSlots.length;
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
      dispatch(loadTimetable(json.saved_timetable, false, autoLockAll));
      dispatch({
        type: ActionTypes.RECEIVE_SAVED_TIMETABLES,
        timetables: json.timetables,
      });
      if (callback !== null) {
        callback();
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
    dispatch(loadTimetable(json.saved_timetable));
    dispatch({
      type: ActionTypes.RECEIVE_SAVED_TIMETABLES,
      timetables: json.timetables,
    });
    return json;
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
        dispatch(loadTimetable(json.timetables[0]));
      } else {
        nullifyTimetable(dispatch);
      }
      return json;
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
      if (state.userInfo.data.social_courses) {
        dispatch(fetchClassmates(getActiveTimetable(state)));
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
    .then((json) => {
      const { timetables, courses } = json;
      dispatch(receiveCourses(courses));
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

export const autoSave = () => (dispatch, getState) => {
  const state = getState();
  const existsSlots = getActiveTimetable(state).slots.length > 0;
  const existsCustomEvents = state.customSlots.length > 0;
  if (state.userInfo.data.isLoggedIn && (existsSlots || existsCustomEvents)) {
    dispatch(saveTimetable(true));
    clearLocalTimetable();
  }
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

export const deleteUser = () => (dispatch) => {
  fetch(getSaveSettingsEndpoint(), {
    headers: {
      'X-CSRFToken': Cookie.get('csrftoken'),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'DELETE',
    credentials: 'include',
  })
    .then((response) => {
      dispatch({
        type: ActionTypes.DELETED_ACCOUNT,
        status: response.status,
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

export const acceptTOS = () => (dispatch) => {
  fetch(acceptTOSEndpoint(), {
    headers: {
      'X-CSRFToken': Cookie.get('csrftoken'),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    method: 'POST',
    body: '',
  })
    .then((response) => {
      if (response.status === 204) {
        dispatch({
          type: ActionTypes.CLOSE_TOS_MODAL,
        });
      }
    });
};

// Show the TOS and privacy policy agreement if the user has not seen the latest version.
// The modal is used for logged in users and the banner is used for anonymous users.
export const handleAgreement = (currentUser, timeUpdatedTos) => (dispatch) => {
  if (currentUser.isLoggedIn) {
    const timeAcceptedTos = currentUser.timeAcceptedTos;
    if (!timeAcceptedTos || Date.parse(timeAcceptedTos) < timeUpdatedTos) {
      dispatch({ type: ActionTypes.TRIGGER_TOS_MODAL });
    }
  } else {
    const timeShownBanner = localStorage.getItem('timeShownBanner');
    if (!timeShownBanner || timeShownBanner < timeUpdatedTos) {
      setTimeShownBanner(Date.now());
      dispatch({ type: ActionTypes.TRIGGER_TOS_BANNER });
    }
  }
};
