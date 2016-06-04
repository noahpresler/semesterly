export const savingTimetable = (state = { activeTimetable: { name: String("Untitled Schedule") }, saving: false, upToDate: false }, action) => {
	switch (action.type) {
		case 'REQUEST_SAVE_TIMETABLE':
			let saving = !state.upToDate;
			return Object.assign( {}, state, { saving });

		case 'RECEIVE_TIMETABLE_SAVED':
			// action.upToDate will be false if the user tried saving 
			// a timetable with a name that already exists
			let { upToDate } = action;
			return Object.assign( {}, state, { saving: false, upToDate });

		case 'RECEIVE_TIMETABLES':
			return Object.assign( {}, state, { upToDate: action.preset === true });

		case 'CHANGE_ACTIVE_SAVED_TIMETABLE':
			return Object.assign( {}, state, { activeTimetable: action.timetable });

		case 'CHANGE_ACTIVE_SAVED_TIMETABLE_NAME':
			return Object.assign( {}, state, { 
				activeTimetable: Object.assign({}, state.activeTimetable, { name: action.name }),
				upToDate: false
			});
		default:
			return state;
	}
}
