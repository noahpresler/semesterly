import { getSunday } from '../actions/calendar_actions.jsx';

export const weeklyCalendar = (state = {activeWeek: getSunday(Date.now()), activeWeekOffset: 0}, action) => {
	switch (action.type) {
		case "SET_TODAY_ACTIVE":
			return Object.assign({}, state, {activeWeek: getSunday(Date.now()), activeWeekOffset: 0});
		case "SET_ACTIVE_WEEK":
			return Object.assign({}, state, {activeWeek: getSunday(action.date), activeWeekOffset: action.weekOffset});
		default:
			return state;
	}
}
