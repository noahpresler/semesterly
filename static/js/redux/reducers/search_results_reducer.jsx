import * as ActionTypes from '../constants/actionTypes.jsx'

export const searchResults = (state = {isFetching: false, items: []}, action) => {
	switch(action.type) {
		case ActionTypes.RECEIVE_COURSES:
			return {
				isFetching: false, 
				items: action.courses,
			};
		case ActionTypes.REQUEST_COURSES:
			return {
				isFetching: true, 
				items: state.items
			};
		default:
			return state;
	}
}
