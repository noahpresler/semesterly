import * as ActionTypes from '../constants/actionTypes.jsx'

let init_state = {
	activeTimetable: { name: String("Untitled Schedule") }, 
	saving: false,
	upToDate: false
}

export const savingTimetable = (state = init_state, action) => {
	switch (action.type) {
		case ActionTypes.REQUEST_SAVE_TIMETABLE:
			let saving = !state.upToDate;
			return Object.assign( {}, state, { saving });

		case ActionTypes.RECEIVE_TIMETABLE_SAVED:
			// action.upToDate will be false if the user tried saving
			// a timetable with a name that already exists
			let { upToDate } = action;
			return Object.assign( {}, state, { saving: false, upToDate });

		case ActionTypes.RECEIVE_TIMETABLES:
			return Object.assign( {}, state, { upToDate: action.preset === true });

		case ActionTypes.CHANGE_ACTIVE_SAVED_TIMETABLE:
			return Object.assign( {}, state, { activeTimetable: action.timetable });

		case ActionTypes.CHANGE_ACTIVE_SAVED_TIMETABLE_NAME:
			return Object.assign( {}, state, {
				activeTimetable: Object.assign({}, state.activeTimetable, { name: action.name }),
				upToDate: false
			});
		case ActionTypes.CHANGE_ACTIVE_TIMETABLE:
			return Object.assign( {}, state, {
				upToDate: false
			});
		default:
			return state;
	}
}
