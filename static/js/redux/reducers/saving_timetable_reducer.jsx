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

import * as ActionTypes from '../constants/actionTypes';

const initState = {
  activeTimetable: { name: String('Untitled Schedule') },
  saving: false,
  upToDate: false,
};

const savingTimetable = (state = initState, action) => {
  switch (action.type) {
    case ActionTypes.REQUEST_SAVE_TIMETABLE: {
      const saving = !state.upToDate;
      return Object.assign({}, state, { saving });
    }

    case ActionTypes.RECEIVE_TIMETABLE_SAVED: {
      // action.upToDate will be false if the user tried saving
      // a timetable with a name that already exists
      const { upToDate } = action;
      return Object.assign({}, state, { saving: false, upToDate });
    }

    case ActionTypes.RECEIVE_TIMETABLES:
      return Object.assign({}, state, { upToDate: action.preset === true });

    case ActionTypes.CHANGE_ACTIVE_SAVED_TIMETABLE:
      return Object.assign({}, state, { activeTimetable: action.timetable });

    case ActionTypes.CHANGE_ACTIVE_SAVED_TIMETABLE_NAME:
      return Object.assign({}, state, {
        activeTimetable: Object.assign({}, state.activeTimetable, { name: action.name }),
        upToDate: false,
      });

    case ActionTypes.ADD_CUSTOM_SLOT:
    case ActionTypes.UPDATE_CUSTOM_SLOT:
    case ActionTypes.REMOVE_CUSTOM_SLOT:
    case ActionTypes.CHANGE_ACTIVE_TIMETABLE:
      return Object.assign({}, state, { upToDate: false });

    default:
      return state;
  }
};

export default savingTimetable;
