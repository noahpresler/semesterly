export const searchResults = (state = {isFetching: false, items: []}, action) => {
	switch(action.type) {
		case 'RECEIVE_COURSES':
			return {
				isFetching: false, 
				items: action.courses,
			};
		case 'REQUEST_COURSES':
			return {
				isFetching: true, 
				items: state.items
			};
		default:
			return state;
	}
}
