import { VALID_SCHOOLS } from '../constants/constants.jsx';
import * as ActionTypes from '../constants/actionTypes.jsx'

export const school = (state = {school: "", areas: [], departments: [], levels: [], dataLastUpdated: ""}, action) => {
	switch (action.type) {
		case ActionTypes.SET_SCHOOL:
			if (VALID_SCHOOLS.indexOf(action.school) >= 0) {
				return Object.assign({}, state, { school: action.school });
			}
			return state;
		case ActionTypes.RECEIVE_SCHOOL_INFO:
			let { areas, departments, levels, last_updated: dataLastUpdated } = action.schoolInfo;
			return Object.assign({}, state, { areas, departments, levels, dataLastUpdated });
		default:
			return state;
	}
}
