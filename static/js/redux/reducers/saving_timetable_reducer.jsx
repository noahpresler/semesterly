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
