import { VALID_SEMESTERS, SET_SEMESTER } from '../constants.jsx';

export const semester = (state = "", action) => {
	switch (action.type) {
		case SET_SEMESTER:
			return action.semester;
		default:
			return state;
	}
}
