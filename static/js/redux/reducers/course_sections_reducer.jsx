export const courseSections = (state = {}, action) => {
	switch(action.type) {
		case 'RECEIVE_COURSE_SECTIONS':
			return action.courseSections;
		default:
			return state;
	}
}
