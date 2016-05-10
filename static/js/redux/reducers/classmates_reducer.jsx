export const classmates = (state = {courseToClassmates: {}, isFetching: false}, action) => {
	switch (action.type) {
		case ("CLASSMATES_RECEIVED"):
			return Object.assign({}, state, { courseToClassmates: action.courses, isFetching: false });
		case ("REQUEST_CLASSMATES"):
			return Object.assign({}, state, { isFetching: true });
		default:
			return state;
	}
}
