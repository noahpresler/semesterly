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
			let new_items = Object.assign({}, state.items);
			action.course.fake = true;
			new_items[state.current].courses.push(action.course);
			return {
				isFetching: false,
				items: new_items,
				current: state.current
			};
		case 'UNHOVER_COURSE':
			let updated_items = Object.assign({}, state.items);
			let courses = state.items[state.current].courses;
			for (let i = 0; i < courses.length; i++) {
				if (courses[i].fake) {
					updated_items[state.current].courses.splice(i, 1);
				}
			}
			return {
				isFetching: false,
				items: updated_items,
				current: state.current
			};
		default:
			return state;
	}
}
