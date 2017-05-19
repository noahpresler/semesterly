import fetch from 'isomorphic-fetch';
import Cookie from 'js-cookie';
import {
    getClassmatesInCourseEndpoint,
    getCourseInfoEndpoint,
    getReactToCourseEndpoint,
} from '../constants/endpoints';
import * as ActionTypes from '../constants/actionTypes';

export const setCourseInfo = json => ({
  type: ActionTypes.COURSE_INFO_RECEIVED,
  data: json,
});

export const setCourseClassmates = json => ({
  type: ActionTypes.COURSE_CLASSMATES_RECEIVED,
  data: json,
});

export const requestCourseInfo = id => ({
  type: ActionTypes.REQUEST_COURSE_INFO,
  id,
});

export const setCourseId = id => ({
  type: ActionTypes.SET_COURSE_ID,
  id,
});

export const fetchCourseClassmates = courseId => (dispatch) => {
  fetch(getClassmatesInCourseEndpoint(courseId), {
    credentials: 'include',
  })
    .then(response => response.json())
    .then((json) => {
      dispatch(setCourseClassmates(json));
    });
};

export const fetchCourseInfo = courseId => (dispatch) => {
  dispatch(requestCourseInfo(courseId));
  fetch(getCourseInfoEndpoint(courseId), {
    credentials: 'include',
  })
  .then(response => response.json())
  .then((json) => {
    dispatch(setCourseInfo(json));
  });
  dispatch(fetchCourseClassmates(courseId));
};

export const react = (cid, title) => (dispatch) => {
  fetch(getReactToCourseEndpoint(), {
    headers: {
      'X-CSRFToken': Cookie.get('csrftoken'),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      cid,
      title,
    }),
    credentials: 'include',
  })
  .then(response => response.json())
  .then((json) => {
    if (!json.error) {
      dispatch({
        type: ActionTypes.SET_COURSE_REACTIONS,
        reactions: json.reactions,
      });
    }
  });
};

export const togglePreferenceModal = () => ({ type: ActionTypes.TOGGLE_PREFERENCE_MODAL });

export const triggerSaveCalendarModal = () => ({ type: ActionTypes.TRIGGER_SAVE_CALENDAR_MODAL });

export const toggleSaveCalendarModal = () => ({ type: ActionTypes.TRIGGER_SAVE_CALENDAR_MODAL });

export const openSignUpModal = () => ({ type: ActionTypes.TOGGLE_SIGNUP_MODAL });

export const changeUserInfo = info => ({
  type: ActionTypes.CHANGE_USER_INFO,
  data: info,
});

export const hideExplorationModal = () => ({ type: ActionTypes.HIDE_EXPLORATION_MODAL });

export const showExplorationModal = () => ({ type: ActionTypes.SHOW_EXPLORATION_MODAL });

export const hideFinalExamsModal = () => ({ type: ActionTypes.HIDE_FINAL_EXAMS_MODAL });

export const triggerAcquisitionModal = () => ({ type: ActionTypes.TRIGGER_ACQUISITION_MODAL });

export const toggleAcquisitionModal = () => ({ type: ActionTypes.TOGGLE_ACQUISITION_MODAL });

export const toggleIntegrationModal = () => ({ type: ActionTypes.TOGGLE_INTEGRATION_MODAL });

export const togglePeerModal = () => ({ type: ActionTypes.TOGGLE_PEER_MODAL });

export const triggerTextbookModal = () => ({ type: ActionTypes.TRIGGER_TEXTBOOK_MODAL });

export const showFinalExamsModal = () => ({ type: ActionTypes.SHOW_FINAL_EXAMS_MODAL });

export const overrideSettingsShow = data => ({
  type: ActionTypes.OVERRIDE_SETTINGS_SHOW,
  data,
});

export const toggleTextbookModal = () => ({ type: ActionTypes.TOGGLE_TEXTBOOK_MODAL });
