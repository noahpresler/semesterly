import fetch from 'isomorphic-fetch';
import Cookie from 'js-cookie';
import { store } from '../init';
import * as ActionTypes from '../constants/actionTypes';
import { getRequestShareExamLinkEndpoint, getFinalExamSchedulerEndpoint } from '../constants/endpoints';
import { getActiveTimetable } from './user_actions';

// TODO - move all other final exam actions to here
// JUST  the fcn  fetchFinalExamSchedule

export const fetchFinalExamSchedule = () => (dispatch) => {
  const state = store.getState();
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

export const getFinalExamShareLink = () => (dispatch) => {
  const state = store.getState();
  const timetable = getActiveTimetable(state.timetables);
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
