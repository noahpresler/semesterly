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

const defaultState = {
  current: -1, // semester.current indexes into semester.all
  all: [], // semester.all is a list of {name, year} objects
};

const semester = (state = defaultState, action) => {
  switch (action.type) {
    case ActionTypes.INIT_STATE:
      return Object.assign({}, state, {
        current: parseInt(action.data.currentSemester, 10),
        all: action.data.allSemesters,
      });
    case ActionTypes.SET_SEMESTER:
      return Object.assign({}, state, { current: action.semester });
    default:
      return state;
  }
};

export const getCurrentSemester = state => state.all[state.current];

export default semester;
