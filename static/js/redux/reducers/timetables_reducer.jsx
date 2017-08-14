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

import update from 'react/lib/update';
import { saveLocalActiveIndex } from '../util';
import * as ActionTypes from '../constants/actionTypes';

export const initialState = {
  isFetching: false,
  items: [{ slots: [], has_conflict: false }],
  hovered: null,
  active: 0,
  loadingCachedTT: true,
  lastSlotAdded: null, // either int (course id), object (custom slots state), or null
};

const timetables = (state = initialState, action) => {
  switch (action.type) {

    case ActionTypes.LOADING_CACHED_TT:
      return Object.assign({}, state, { loadingCachedTT: true });

    case ActionTypes.CACHED_TT_LOADED:
      return Object.assign({}, state, { loadingCachedTT: false });

    case ActionTypes.REQUEST_TIMETABLES:
      return Object.assign({}, state, { isFetching: true });

    case ActionTypes.SET_SEMESTER:
      return Object.assign({}, state, { isFetching: false });

    case ActionTypes.RECEIVE_TIMETABLES: {
      const actionTimetables = action.timetables.length > 0 ? action.timetables : [{
        slots: [],
        has_conflict: false,
      }];

      return {
        isFetching: false,
        items: actionTimetables,
        hovered: null,
        active: 0,
      };
    }

    case ActionTypes.RECEIVE_COURSES:
      return Object.assign({}, state, { isFetching: false });

    case ActionTypes.HOVER_SECTION:
      return { ...state, hovered: action.slot };

    case ActionTypes.UNHOVER_SECTION:
      return { ...state, hovered: null };

    case ActionTypes.CHANGE_ACTIVE_TIMETABLE:
      saveLocalActiveIndex(action.newActive);
      return Object.assign({}, state, { active: action.newActive });

    case ActionTypes.ALERT_CONFLICT:
      return Object.assign({}, state, { isFetching: false });

    case ActionTypes.UPDATE_LAST_COURSE_ADDED:
      return Object.assign({}, state, { lastSlotAdded: action.course });

    default:
      return state;
  }
};

export const getTimetables = state => state.items;

export const getActiveTimetable = state => state.items[state.active];

export const getHoveredSlots = state => state.hovered;

export default timetables;
