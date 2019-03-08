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
import { isIncomplete } from '../util';

export const initialState = {
  data: { isLoggedIn: false },
  overrideHide: false, // hide the user settings modal if true. Overrides overrideShow
  overrideShow: false, // show the user settings modal if true
  isVisible: false,
  saving: false,
  isFetching: false,
  isDeleted: false,
};

const userInfo = (state = initialState, action) => {
  switch (action.type) {
    case ActionTypes.INIT_STATE:
      return Object.assign({}, state, { data: action.data.currentUser, isFetching: false });
    case ActionTypes.OVERRIDE_SETTINGS_SHOW:
      return Object.assign({}, state, { overrideShow: action.data });
    case ActionTypes.OVERRIDE_SETTINGS_HIDE:
      return Object.assign({}, state, { overrideHide: action.data });
    case ActionTypes.REQUEST_SAVE_USER_INFO:
      return Object.assign({}, state, { saving: true });
    case ActionTypes.CHANGE_USER_INFO: {
      const changeData = action.data;
      changeData.social_courses = changeData.social_offerings ? true : changeData.social_courses;
      return Object.assign({}, state, { data: changeData });
    }
    case ActionTypes.RECEIVE_USER_INFO_SAVED:
      return Object.assign({}, state, { saving: false });
    case ActionTypes.REQUEST_USER_INFO:
      return Object.assign({}, state, { isFetching: true });
    case ActionTypes.RECEIVE_SAVED_TIMETABLES: {
      const newData = Object.assign({}, state.data, { timetables: action.timetables });
      return Object.assign({}, state, { data: newData });
    }
    case ActionTypes.SET_SETTINGS_MODAL_VISIBLE:
      return Object.assign({}, state, { isVisible: true });
    case ActionTypes.SET_SETTINGS_MODAL_HIDDEN:
      return Object.assign({}, state, { isVisible: false });
    case ActionTypes.DELETED_ACCOUNT:
      return Object.assign({}, state, { isDeleted: true });
    default:
      return state;
  }
};

export const isUserInfoIncomplete = (state) => {
  const fields = state.data.FacebookSignedUp ?
  ['social_offerings', 'social_courses',
    'major', 'class_year'] :
    ['major', 'class_year'];
  return state.data.isLoggedIn && fields.map(field => state.data[field])
    .some(val => isIncomplete(val));
};

export default userInfo;
