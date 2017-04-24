import fetch from 'isomorphic-fetch';
import { store } from '../init';
import * as ActionTypes from '../constants/actionTypes';
import { getShareFinalExamEndpoint, getFinalExamSchedulerEndpoint } from '../constants/endpoints';
import { getActiveTimetable } from './user_actions';

// TODO - move all other final exam actions to here
// JUST  the fcn  fetchFinalExamSchedule

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

export const getFinalExamShareLink = () => (dispatch) => {
  const state = store.getState();
  const timetable = getActiveTimetable(state.timetables);
  fetch(getShareFinalExamEndpoint(), {
    credentials: 'include',
    method: 'POST',
    body: JSON.stringify(timetable),
  })
  .then(response => response.json())
  .then((link) => {
    dispatch({ type: ActionTypes.RECIEVE_EXAMS_SHARE_LINK, link });
  });
};
