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

import COLOUR_DATA from '../constants/colours';
import * as ActionTypes from '../constants/actionTypes';

const initialState = {
  searchHover: 0,
  courseToColourIndex: {},
  uses12HrTime: false,
  highlightNotifs: false, // add yellow styling to notifications
};

const ui = (state = initialState, action) => {
  switch (action.type) {
    case ActionTypes.INIT_STATE:
      return Object.assign({}, state, { uses12HrTime: action.data.uses12HrTime });
    case ActionTypes.HOVER_SEARCH_RESULT:
      return Object.assign({}, state, { searchHover: action.position });
    case ActionTypes.RECEIVE_TIMETABLES: {
      // update slot colours based on new timetables
      const timetables = action.timetables.length > 0 ? action.timetables : [{
        courses: [],
        has_conflict: false,
      }];
      const existingCourseToColour = !action.saving && action.preset
        ? {} : state.courseToColourIndex;
      const courseToColourIndex = {};
      const usedColourIndices = Object.values(existingCourseToColour);
      for (let i = 0; i < timetables[0].courses.length; i++) {
        const cid = timetables[0].courses[i].id;
        if (cid in existingCourseToColour) { // course already has a colour
          courseToColourIndex[cid] = existingCourseToColour[cid];
        } else {
          const newUsed = Object.values(courseToColourIndex);
          // find unused colourIndex
          courseToColourIndex[cid] = _.range(COLOUR_DATA.length).find(idx =>
            !usedColourIndices.concat(newUsed).some(x => x === idx),
          );
        }
      }
      return Object.assign({}, state, { courseToColourIndex });
    }
    case ActionTypes.SET_HIGHLIGHT_NOTIFS:
      return Object.assign({}, state, { highlightNotifs: action.highlightNotifs });
    default:
      return state;
  }
};

export default ui;
