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
import groupBy from 'lodash/groupBy';
import flatMap from 'lodash/flatMap';
import * as ActionTypes from '../constants/actionTypes';
import { getActiveDenormTimetable } from '../reducers';
import { getRequestShareExamLinkEndpoint, getFinalExamSchedulerEndpoint } from '../constants/endpoints';

// this is a function introduced in #934 to a revert a timetable into the timetable shape from
// before #934 (ie { courses: [... slots: []] }, where slot here refers to an offering merged
// with its section data. Since exams are no longer actively supported/updated after #934,
// this function exists as the minimum change necessary to keep exam functionality alive
export const revert = function revertTimetableFormat(denormTimetable) {
  const groupedByCourse = groupBy(denormTimetable.slots, slot => slot.course.id);
  const courses = Object.keys(groupedByCourse).map((courseId) => {
    const slots = groupedByCourse[courseId];
    return {
      ...slots[0].course,
      slots: flatMap(slots, slot => slot.offerings.map(offering => ({
        ...slot.section,
        ...offering,
      }))),
    };
  });

  return { courses };
};

export const fetchFinalExamSchedule = () => (dispatch, getState) => {
  const state = getState();
  dispatch({ type: ActionTypes.FETCH_FINAL_EXAMS });
  fetch(getFinalExamSchedulerEndpoint(), {
    headers: {
      'X-CSRFToken': Cookie.get('csrftoken'),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    method: 'POST',
    body: JSON.stringify(revert(getActiveDenormTimetable(state))),
  })
    .then(response => response.json())
    .then((json) => {
      dispatch({ type: ActionTypes.RECEIVE_FINAL_EXAMS, json });
    });
};

export const getFinalExamShareLink = () => (dispatch, getState) => {
  const state = getState();
  fetch(getRequestShareExamLinkEndpoint(), {
    headers: {
      'X-CSRFToken': Cookie.get('csrftoken'),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    method: 'POST',
    body: JSON.stringify(revert(getActiveDenormTimetable(state))),
  })
  .then(response => response.json())
  .then((json) => {
    dispatch({ type: ActionTypes.RECEIVE_EXAMS_SHARE_LINK, link: json.slug });
  });
};
