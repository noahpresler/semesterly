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

import COLOUR_DATA from '../constants/colours';
import * as ActionTypes from '../constants/actionTypes';
import { getNextAvailableColour } from '../util';
import { getCourseIdsFromSlots } from '../reducers/entities_reducer';

const initialState = {
  searchHover: 0,
  courseToColourIndex: {},
  uses12HrTime: false,
  highlightNotifs: false, // add yellow styling to notifications
};

const ui = (state = initialState, action) => {
  switch (action.type) {
    case ActionTypes.INIT_STATE:
      return { ...state, uses12HrTime: action.data.uses12HrTime };
    case ActionTypes.HOVER_SEARCH_RESULT:
      return { ...state, searchHover: action.position };
    case ActionTypes.RECEIVE_TIMETABLES: {
      const courses = action.timetables.length > 0 ?
        getCourseIdsFromSlots(action.timetables[0].slots) : [];

      const courseToColourIndex = {};

      courses.forEach((courseId) => {
        // if this course already had a colour, use that. Otherwise get a new one
        courseToColourIndex[courseId] = (courseId in state.courseToColourIndex) ?
          state.courseToColourIndex[courseId] : getNextAvailableColour(courseToColourIndex);
      });

      return { ...state, courseToColourIndex };
    }
    case ActionTypes.SET_HIGHLIGHT_NOTIFS:
      return { ...state, highlightNotifs: action.highlightNotifs };
    case ActionTypes.REQUEST_COURSES:
      return { ...state, searchHover: 0 };
    default:
      return state;
  }
};

export default ui;
