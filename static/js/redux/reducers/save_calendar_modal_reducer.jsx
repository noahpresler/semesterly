export const saveCalendarModal = (state = { isVisible: false }, action) => {
	switch (action.type) {
		case 'TOGGLE_SAVE_CALENDAR_MODAL':
			console.log("HERE!");
			return {isVisible: !state.isVisible};
		case 'TRIGGER_SAVE_CALENDAR_MODAL':
			return {isVisible: true};
		default:
			return state;
	}
}
