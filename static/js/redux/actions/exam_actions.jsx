import fetch from 'isomorphic-fetch';
import Cookie from 'js-cookie';
import * as ActionTypes from '../constants/actionTypes';
import { getActiveTimetable } from '../reducers/root_reducer';
import { getRequestShareExamLinkEndpoint, getFinalExamSchedulerEndpoint } from '../constants/endpoints';

export const fetchFinalExamSchedule = () => (dispatch, getState) => {
  const state = getState();
  const timetable = getActiveTimetable(state);
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

export const getFinalExamShareLink = () => (dispatch, getState) => {
  const state = getState();
  const timetable = getActiveTimetable(state);
  fetch(getRequestShareExamLinkEndpoint(), {
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
    dispatch({ type: ActionTypes.RECEIVE_EXAMS_SHARE_LINK, link: json.slug });
  });
};
