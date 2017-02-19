import { getSunday } from '../actions/calendar_actions.jsx';

export const weeklyCalendar = (state = {activeWeek: getSunday(Date.now())}, action) => {
	switch (action.type) {
		case "SET_ACTIVE_WEEK":
			return Object.assign({}, state, { activeWeek: true });
		default:
			return state;
	}
}
