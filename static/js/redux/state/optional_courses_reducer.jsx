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

import without from "lodash/without";
import * as ActionTypes from "../constants/actionTypes";

// TODO: add UI for adjusting num required
const optionalCourses = (state = { courses: [], numRequired: 0 }, action) => {
  switch (action.type) {
    case ActionTypes.ADD_REMOVE_OPTIONAL_COURSE: {
      if (state.courses.find((c) => c === action.newCourseId)) {
        return {
          ...state,
          courses: without(state.courses, action.newCourseId),
          numRequired: state.numRequired - 1,
        };
      }
      return {
        ...state,
        courses: state.courses.concat([action.newCourseId]),
        numRequired: state.numRequired + 1,
      };
    }
    case ActionTypes.REMOVE_OPTIONAL_COURSE_BY_ID: {
      return {
        ...state,
        courses: without(state.courses, action.newCourseId),
        numRequired: state.numRequired - 1,
      };
    }
    case ActionTypes.CLEAR_OPTIONAL_COURSES:
      return { courses: [], numRequired: 0 };
    default:
      return state;
  }
};

export default optionalCourses;
