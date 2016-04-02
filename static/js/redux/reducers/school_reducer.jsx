import { VALID_SCHOOLS, SET_SCHOOL } from '../constants.jsx';

export const school = (state = "", action) => {
	switch (action.type) {
		case SET_SCHOOL:
			if (VALID_SCHOOLS.indexOf(action.school) >= 0) {
				return action.school;
			}
			return state;
		default:
			return state;
	}
}
