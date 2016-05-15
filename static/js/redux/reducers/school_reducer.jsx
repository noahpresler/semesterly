import { VALID_SCHOOLS, SET_SCHOOL } from '../constants.jsx';

export const school = (state = {school: "", areas: []}, action) => {
	switch (action.type) {
		case SET_SCHOOL:
			if (VALID_SCHOOLS.indexOf(action.school) >= 0) {
				return Object.assign({}, state, { school: action.school });
			}
			return state;
		default:
			return state;
	}
}
