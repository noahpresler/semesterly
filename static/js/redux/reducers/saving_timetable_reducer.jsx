import * as ActionTypes from '../constants/actionTypes';

const initState = {
  activeTimetable: { name: String('Untitled Schedule') },
  saving: false, // true if we are currently waiting for a response from the backend
  upToDate: false,
};

const savingTimetable = (state = initState, action) => {
  switch (action.type) {
    case ActionTypes.REQUEST_SAVE_TIMETABLE: {
      const saving = !state.upToDate;
      return { ...state, saving };
    }

    case ActionTypes.CHANGE_ACTIVE_SAVED_TIMETABLE:
      return {
        ...state,
        activeTimetable: action.timetable,
        saving: false,
        upToDate: true,
      };

    case ActionTypes.ALERT_TIMETABLE_EXISTS:
      return { ...state, saving: false };

    case ActionTypes.CHANGE_ACTIVE_SAVED_TIMETABLE_NAME:
      return {
        ...state,
        activeTimetable: { ...state.activeTimetable, name: action.name },
        upToDate: false,
      };

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
