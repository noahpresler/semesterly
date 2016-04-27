export const alerts = (state = {alert_conflict: false}, action) => {
	switch (action.type) {
		case "ALERT_CONFLICT":
			return Object.assign({}, {alert_conflict: true});
		case "DISMISS_ALERT_CONFLICT":
			return Object.assign({}, {alert_conflict: false});
		default:
			return state;
	}
}
