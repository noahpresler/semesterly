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

import { VALID_SCHOOLS } from '../constants/schools';
import * as ActionTypes from '../constants/actionTypes';

const school = (state = {
  school: '',
  areas: [],
  departments: [],
  levels: [],
  dataLastUpdated: '',
}, action) => {
  switch (action.type) {
    case ActionTypes.INIT_STATE:
      if (VALID_SCHOOLS.indexOf(action.data.school) >= 0) {
        return Object.assign({}, state, { school: action.data.school });
      }
      return state;
    case ActionTypes.RECEIVE_SCHOOL_INFO: {
      const { areas, departments, levels, last_updated: dataLastUpdated } = action.schoolInfo;
      return Object.assign({}, state, { areas, departments, levels, dataLastUpdated });
    }
    default:
      return state;
  }
};

export default school;
