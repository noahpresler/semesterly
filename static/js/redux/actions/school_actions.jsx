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

import { getSchoolInfoEndpoint } from '../constants/endpoints';
import * as ActionTypes from '../constants/actionTypes';
import { getCurrentSemester } from '../reducers';

export const getSchool = state => state.school.school;
export const getSemester = (state) => {
  const currSemester = getCurrentSemester(state);
  return `${currSemester.name}/${currSemester.year}`;
};

export const fetchSchoolInfo = () => (dispatch, getState) => {
  dispatch({ type: ActionTypes.REQUEST_SCHOOL_INFO });
  fetch(getSchoolInfoEndpoint(getSchool(getState())))
    .then(response => response.json())
    .then((json) => {
      dispatch({
        type: ActionTypes.RECEIVE_SCHOOL_INFO,
        schoolInfo: json,
      });
    });
};
