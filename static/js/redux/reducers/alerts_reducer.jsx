export const alerts = (state = {alertConflict: false, 
								alertTimetableExists: false, 
								alertChangeSemester: false,
								alertNewTimetable: false}, action) => {
	switch (action.type) {
		// dispatched when there's a conflict
		case "ALERT_CONFLICT":
			return Object.assign({}, state, {alertConflict: true});
		case "DISMISS_ALERT_CONFLICT":
			return Object.assign({}, state, {alertConflict: false});
		// dispatched there's a saved timetable with the same name
		case "ALERT_TIMETABLE_EXISTS":
			return Object.assign({}, state, {alertTimetableExists: true});
		case "DISMISS_TIMETABLE_EXISTS":
			return Object.assign({}, state, {alertTimetableExists: false});
		// dispatched when the user tries to change semester,
		// while having an unsaved timetable (if logged in), or
		// if they're logged out, since while logged out their timetable is cleared
		case "ALERT_CHANGE_SEMESTER":
			return Object.assign({}, state, {alertChangeSemester: true});
		case "DISMISS_ALERT_CHANGE_SEMESTER":
			return Object.assign({}, state, {alertChangeSemester: false});
		// dispatched when the user tries to create a new timetable but the current one is unsaved
		case "ALERT_NEW_TIMETABLE":
			return Object.assign({}, state, {alertNewTimetable: true});
		case "DISMISS_ALERT_NEW_TIMETABLE":
			return Object.assign({}, state, {alertNewTimetable: false});
		default:
			return state;
	}
}
