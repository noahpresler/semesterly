let initialState = {isFetching: false, items: [{courses: []}], current: 0};
export const timetables = (state = initialState, action) => {
	switch(action.type) {
		case 'REQUEST_TIMETABLES':
			return {
				isFetching: true, 
				items: state.items,
				current: 0,
			};
		case 'RECEIVE_TIMETABLES':
			let timetables = action.timetables.length > 0 ? action.timetables : initialState.items;
			return {
				isFetching: false, 
				items: timetables,
				current: 0
			};
		case 'HOVER_COURSE':
			let current_courses = state.items[state.current].courses;
			if (current_courses.some(course => course.fake)) { // only one "fake" (hovered course) at a time
				return state;
			}
			let new_state = $.extend({}, state);
			action.course.fake = true;
			new_state.items[state.current].courses.push(action.course);
			return new_state;
		case 'UNHOVER_COURSE':
			let new_s = $.extend({}, state);
			let courses = new_s.items[state.current].courses;
			for (let i = 0; i < courses.length; i++) {
				if (courses[i].fake) {
					new_s.items[state.current].courses.splice(i, 1);
				}
			}
			return new_s;
		default:
			return state;
	}
}
