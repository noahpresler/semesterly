export const savingTimetable = (state = { name: "", saving: false }, action) => {
	switch (action.type) {
		case 'REQUEST_SAVE_TIMETABLE':
			return Object.assign( {}, state, { saving: true });
		case 'RECEIVE_TIMETABLE_SAVED':
			return Object.assign( {}, state, { saving: false });
		case 'CHANGE_TIMETABLE_NAME':
			return Object.assign( {}, state, { name: action.name });
		default:
			return state;
	}
}

