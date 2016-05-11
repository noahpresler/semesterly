export const alerts = (state = {alertConflict: false, alertTimetableExists: false}, action) => {
	switch (action.type) {
		case "ALERT_CONFLICT":
			return Object.assign({}, {alertConflict: true});
		case "DISMISS_ALERT_CONFLICT":
			return Object.assign({}, {alertConflict: false});
		case "ALERT_TIMETABLE_EXISTS":
			return Object.assign({}, {alertTimetableExists: true});
		case "DISMISS_TIMETABLE_EXISTS":
			return Object.assign({}, {alertTimetableExists: false});	
		default:
			return state;
	}
}
