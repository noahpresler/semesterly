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

import * as ActionTypes from '../constants/actionTypes';

const courseInfo = (state = {
  isFetching: true,
  isFetchingClassmates: true,
  data: {}, // TODO: remove, should refer to course entities
  id: null,
  classmates: {},
}, action) => {
  switch (action.type) {
    case ActionTypes.COURSE_INFO_RECEIVED:
      return Object.assign({}, state, {
        isFetching: false,
        id: action.response.result,
      });
    case ActionTypes.COURSE_CLASSMATES_RECEIVED:
      return Object.assign({}, state, {
        isFetchingClassmates: false,
        classmates: action.data,
      });
    case ActionTypes.REQUEST_COURSE_INFO:
      return {
        isFetching: true,
        isFetchingClassmates: true,
        data: {},
        classmates: {},
        id: null,
      };
    case ActionTypes.SET_COURSE_REACTIONS:
      if (state.id === null) {
        return state;
      }
      return Object.assign({}, state,
        {
          data: Object.assign({}, state.data, {
            reactions: action.reactions,
          }),
        });
    case ActionTypes.SET_COURSE_ID:
      return Object.assign({}, state, { id: action.id });
    default:
      return state;
  }
};

export const getCourseInfoId = state => state.id;

export default courseInfo;
