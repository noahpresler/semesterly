/**
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
**/

import fetch from 'isomorphic-fetch';
import Cookie from 'js-cookie';
import * as ActionTypes from '../constants/actionTypes';
import { getRequestShareExamLinkEndpoint, getFinalExamSchedulerEndpoint } from '../constants/endpoints';
import { getActiveTimetable } from './user_actions';

// TODO - move all other final exam actions to here
// JUST  the fcn  fetchFinalExamSchedule

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

export const getFinalExamShareLink = () => (dispatch, getState) => {
  const state = getState();
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
