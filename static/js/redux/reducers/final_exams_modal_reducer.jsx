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

const finalExamsModal = (state = {
  isVisible: false,
  isLoading: true,
  finalExams: null,
  link: null,
  fromShare: false,
}, action) => {
  switch (action.type) {
    case ActionTypes.HIDE_FINAL_EXAMS_MODAL:
      return Object.assign({}, state, { isVisible: false, fromShare: false });
    case ActionTypes.SHOW_FINAL_EXAMS_MODAL:
      return Object.assign({}, state, { isVisible: true });
    case ActionTypes.FETCH_FINAL_EXAMS:
      return Object.assign({}, state, { isLoading: true, finalExams: null });
    case ActionTypes.RECEIVE_FINAL_EXAMS:
      return Object.assign({}, state, { isLoading: false, finalExams: action.json });
    case ActionTypes.RECEIVE_EXAMS_SHARE_LINK:
      return Object.assign({}, state, { link: action.link });
    case ActionTypes.SET_FINAL_EXAMS_SHARED:
      return Object.assign({}, state, { fromShare: true });
    default:
      return state;
  }
};

export default finalExamsModal;
