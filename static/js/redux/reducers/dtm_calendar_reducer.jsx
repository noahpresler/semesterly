export const dtmCalendars = (state = { 
	isLoading: false,
	calendars: {},
	availability: {},
	sharedAvailability: null,
	mergedAvailability: null,
	dirty: true
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
			return Object.assign({}, state, { calendars: new_calendars, dirty: true});
		case "RECEIVE_AVAILABILITY":
			return Object.assign({}, state, { availability: action.availability, dirty: true });
		case "RECEIVE_SHARED_AVAILABILITY":
			return Object.assign({}, state, { sharedAvailability: action.shareAvailability });
		case "RECEIVE_MERGED_AVAILABILITY":
			return Object.assign({}, state, { mergedAvailability: action.mergedAvailability });
		case "CLEAN_AVAILABILITY":
			return Object.assign({}, state, { dirty: false });
		default:
			return state;
	}
}