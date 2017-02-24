import { VALID_SEMESTERS, SET_SEMESTER } from '../constants.jsx';

export const semester = (state = 0, action) => {
	switch (action.type) {
		case SET_SEMESTER:
			return action.semester;
		default:
			return state;
	}
}
