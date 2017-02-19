export const dtmCalendars = (state = { 
	isLoading: false,
	calendars: {}
}, action) => {
	switch (action.type) {
		case 'RECEIVE_GOOGLE_CALENDARS':
			return Object.assign({}, state, { calendars: action.calendars });
		default:
			return state;
	}
}
