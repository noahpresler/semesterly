import { getSunday } from '../actions/calendar_actions.jsx';

export const weeklyCalendar = (state = {activeWeek: getSunday(Date.now()), activeWeekOffset: 0, isModal: false}, action) => {
	switch (action.type) {
		case "SET_TODAY_ACTIVE":
			return Object.assign({}, state, {activeWeek: getSunday(Date.now()), activeWeekOffset: 0});
		case "SET_ACTIVE_WEEK":
			return Object.assign({}, state, {activeWeek: getSunday(action.date), activeWeekOffset: action.weekOffset});
		case "LAUNCH_SHARE_AVAILABILITY_MODAL":
			return Object.assign({}, state, {isModal: true});
		case "HIDE_SHARE_AVAILABILITY_MODAL":
			return Object.assign({}, state, {isModal: false});
		default:
			return state;
	}
}
