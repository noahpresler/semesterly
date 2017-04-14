import fetch from 'isomorphic-fetch';
import {
    getClassmatesInCourseEndpoint,
    getCourseInfoEndpoint,
    getReactToCourseEndpoint,
} from '../constants/endpoints';
import { store } from '../init';
import * as ActionTypes from '../constants/actionTypes';

export function setCourseInfo(json) {
  return {
    type: ActionTypes.COURSE_INFO_RECEIVED,
    data: json,
  };
}

export function setCourseClassmates(json) {
  return {
    type: ActionTypes.COURSE_CLASSMATES_RECEIVED,
    data: json,
  };
}

export function requestCourseInfo(id) {
  return {
    type: ActionTypes.REQUEST_COURSE_INFO,
    id,
  };
}

export function setCourseId(id) {
  return {
    type: ActionTypes.SET_COURSE_ID,
    id,
  };
}

export function fetchCourseClassmates(courseId) {
  return (dispatch) => {
    fetch(getClassmatesInCourseEndpoint(courseId), {
      credentials: 'include',
    })
      .then(response => response.json()) // TODO(rohan): error-check the response
      .then((json) => {
        dispatch(setCourseClassmates(json));
      });
  };
}

export function fetchCourseInfo(courseId) {
  return (dispatch) => {
    dispatch(requestCourseInfo(courseId));
    fetch(getCourseInfoEndpoint(courseId), {
      credentials: 'include',
    })
            .then(response => response.json()) // TODO(rohan): error-check the response
            .then((json) => {
              dispatch(setCourseInfo(json));
            });
    dispatch(fetchCourseClassmates(courseId));
  };
}

export function react(cid, title) {
  fetch(getReactToCourseEndpoint(), {
    method: 'POST',
    body: JSON.stringify({
      cid,
      title,
    }),
    credentials: 'include',
  })
        .then(response => response.json()) // TODO(rohan): error-check the response
        .then((json) => {
          if (!json.error) {
            store.dispatch({
              type: ActionTypes.SET_COURSE_REACTIONS,
              reactions: json.reactions,
            });
          }
        });
}

export function togglePreferenceModal() {
  return { type: ActionTypes.TOGGLE_PREFERENCE_MODAL };
}

export function triggerSaveCalendarModal() {
  return { type: ActionTypes.TRIGGER_SAVE_CALENDAR_MODAL };
}

export function toggleSaveCalendarModal() {
  return { type: ActionTypes.TRIGGER_SAVE_CALENDAR_MODAL };
}

export function openSignUpModal() {
  return { type: ActionTypes.TOGGLE_SIGNUP_MODAL };
}

export function changeUserInfo(info) {
  return {
    type: ActionTypes.CHANGE_USER_INFO,
    data: info,
  };
}

export function hideExplorationModal() {
  return { type: ActionTypes.HIDE_EXPLORATION_MODAL };
}

export function showExplorationModal() {
  return { type: ActionTypes.SHOW_EXPLORATION_MODAL };
}

export function hideFinalExamsModal() {
  return { type: ActionTypes.HIDE_FINAL_EXAMS_MODAL };
}

export function triggerAcquisitionModal() {
  return { type: ActionTypes.TRIGGER_ACQUISITION_MODAL };
}

export const toggleIntegrationModal = () => ({ type: ActionTypes.TOGGLE_INTEGRATION_MODAL });

export const togglePeerModal = () => ({ type: ActionTypes.TOGGLE_PEER_MODAL });

export const triggerTextbookModal = () => ({ type: ActionTypes.TRIGGER_TEXTBOOK_MODAL });

export const showFinalExamsModal = () => ({ type: ActionTypes.SHOW_FINAL_EXAMS_MODAL });

export const overrideSettingsShow = data => ({
  type: ActionTypes.OVERRIDE_SETTINGS_SHOW,
  data,
});

export const toggleTextbookModal = () => ({ type: ActionTypes.TOGGLE_TEXTBOOK_MODAL });
