import { VALID_SEMESTERS, SET_SEMESTER } from '../constants.jsx';

export const semester = (state = "", action) => {
	switch (action.type) {
		case SET_SEMESTER:
			if (VALID_SCHOOLS.indexOf(action.semester) >= 0) {
				return action.semester;
			}
			return state;
		default:
			return state;
	}
}
