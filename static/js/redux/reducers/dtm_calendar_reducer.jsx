export const dtmCalendars = (state = { 
	isLoading: false,
	calendars: {},
	availability: {}
}, action) => {
	switch (action.type) {
		case 'RECEIVE_GOOGLE_CALENDARS':
			return Object.assign({}, state, { calendars: action.calendars });
		case 'TOGGLE_CALENDAR_VISIBILITY':
			let new_calendars = state.calendars.map(cal => {
				if (cal.id == action.id) {
					let new_cal = cal
					new_cal['visible'] = !cal['visible']
					return new_cal
				}
				return cal
			})
			return Object.assign({}, state, { calendars: new_calendars });
		case "RECEIVE_AVAILABILITY":
			return Object.assign({}, state, { availability: action.availability });
		default:
			return state;
	}
}