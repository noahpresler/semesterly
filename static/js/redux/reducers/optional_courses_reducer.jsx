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

import update from 'react/lib/update';
import * as ActionTypes from '../constants/actionTypes';

const optionalCourses = (state = { courses: [], numRequired: 0 }, action) => {
  switch (action.type) {
    case ActionTypes.ADD_REMOVE_OPTIONAL_COURSE: {
      const idx = state.courses.findIndex(c => c.id === action.newCourse.id);
      if (idx !== -1) { // removing
        const newCourses = [
          ...state.courses.slice(0, idx),
          ...state.courses.slice(idx + 1),
        ];
        return Object.assign({}, state, {
          courses: newCourses,
          numRequired: newCourses.length,
        });
      }  // adding
      const newState = update(state, {
        courses: {
          $push: [action.newCourse],
        },
      });
      return Object.assign({}, newState, { numRequired: newState.courses.length });
    }
    case ActionTypes.REMOVE_OPTIONAL_COURSE_BY_ID: {
      const index = state.courses.findIndex(c => c.id === action.courseId);
      if (index !== -1) {
        const newCourses = [
          ...state.courses.slice(0, index),
          ...state.courses.slice(index + 1),
        ];
        return Object.assign({}, state, {
          courses: newCourses,
          numRequired: newCourses.length,
        });
      }
      return state;
    }
    case ActionTypes.CLEAR_OPTIONAL_COURSES:
      return { courses: [], numRequired: 0 };
    default:
      return state;
  }
};

export default optionalCourses;
