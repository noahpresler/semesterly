export const savingTimetable = (state = { activeTimetable: { name: String("May 10 2016 2:42pm") } , saving: false, upToDate: true }, action) => {
	switch (action.type) {
		case 'REQUEST_SAVE_TIMETABLE':
			return Object.assign( {}, state, { saving: true });
		case 'RECEIVE_TIMETABLE_SAVED':
			return Object.assign( {}, state, { saving: false, upToDate: true });
		case 'RECEIVE_TIMETABLES':
			return Object.assign( {}, state, { upToDate: action.preset === true });
		case 'CHANGE_TIMETABLE_NAME':
			return Object.assign( {}, state, { name: action.name });
		case 'CHANGE_ACTIVE_SAVED_TIMETABLE':
			return Object.assign( {}, state, { activeTimetable: action.timetable });
		default:
			return state;
	}
}
