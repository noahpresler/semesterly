let initialState = {isFetching: false, items: [{courses: []}], active: 0};
export const timetables = (state = initialState, action) => {
	switch(action.type) {
		case 'REQUEST_TIMETABLES':
			return {
				isFetching: true, 
				items: state.items,
				active: 0,
			};
		case 'RECEIVE_TIMETABLES':
			let timetables = action.timetables.length > 0 ? action.timetables : initialState.items;
			return {
				isFetching: false, 
				items: timetables,
				active: 0
			};
		case 'HOVER_COURSE':
			let current_courses = state.items[state.active].courses;
			if (current_courses.some(course => course.fake)) { // only one "fake" (hovered course) at a time
				return state;
			}
			let new_items = [...state.items];
			action.course.fake = true;
			new_items[state.active].courses.push(action.course);
			return {
				isFetching: false,
				items: new_items,
				active: state.active
			};
		case 'UNHOVER_COURSE':
			let updated_items = [...state.items]
			let courses = state.items[state.active].courses;
			for (let i = 0; i < courses.length; i++) {
				if (courses[i].fake) {
					updated_items[state.active].courses.splice(i, 1);
				}
			}
			return {
				isFetching: false,
				items: updated_items,
				active: state.active
			};
		case 'CHANGE_ACTIVE_TIMETABLE':
			return Object.assign({}, state, { active: action.new_active });
		default:
			return state;
	}
}
