export const courseSections = (state = {}, action) => {
	switch(action.type) {
		case 'ADD_COURSE':
			// create copy of course_sections (aka @state here) and assign it new values,
			// so that original course_sections remains unchanged
			return {35485: {}};
		default:
			return state;
	}
}
