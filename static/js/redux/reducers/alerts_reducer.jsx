export const alerts = (state = {alertConflict: false, alertTimetableExists: false, alertChangeSemester: false}, action) => {
	switch (action.type) {
		case "ALERT_CONFLICT":
			return Object.assign({}, state, {alertConflict: true});
		case "DISMISS_ALERT_CONFLICT":
			return Object.assign({}, state, {alertConflict: false});
		case "ALERT_TIMETABLE_EXISTS":
			return Object.assign({}, state, {alertTimetableExists: true});
		case "DISMISS_TIMETABLE_EXISTS":
			return Object.assign({}, state, {alertTimetableExists: false});	
		case "ALERT_CHANGE_SEMESTER":
			return Object.assign({}, state, {alertChangeSemester: true});
		case "DISMISS_ALERT_CHANGE_SEMESTER":
			return Object.assign({}, state, {alertChangeSemester: false});
		default:
			return state;
	}
}
