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

const calendar = (state = {
  shareLink: null,
  isFetchingShareLink: false,
  shareLinkValid: false,
}, action) => {
  switch (action.type) {
    case ActionTypes.REQUEST_SHARE_TIMETABLE_LINK:
      return Object.assign({}, state, { isFetchingShareLink: true });
    case ActionTypes.RECEIVE_SHARE_TIMETABLE_LINK:
      return Object.assign({}, state, {
        shareLink: action.shareLink,
        isFetchingShareLink: false,
        shareLinkValid: true,
      });
    case ActionTypes.RECEIVE_TIMETABLES:
    case ActionTypes.CHANGE_ACTIVE_TIMETABLE:
      return Object.assign({}, state, { shareLinkValid: false });
    default:
      return state;
  }
};

export default calendar;
