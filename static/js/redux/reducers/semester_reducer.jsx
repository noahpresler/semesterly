import { SET_SEMESTER } from '../constants.jsx';

export const semesterIndex = (state = 0, action) => {
	switch (action.type) {
		case SET_SEMESTER:
			return action.semester;
		default:
			return state;
	}
}
