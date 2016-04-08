let initialState = {isFetching: false, items: [{courses: []}], current: 0};
export const timetables = (state = initialState, action) => {
	switch(action.type) {
		case 'REQUEST_TIMETABLES':
			return {
				isFetching: true, 
				items: [{courses: []}],
				current: 0,
			};
		case 'RECEIVE_TIMETABLES':
			return {
				isFetching: false, 
				items: action.timetables,
				current: 0
			};
		case 'HOVER_COURSE':
			let new_state = $.extend({}, state);
			new_state.items[state.current].courses.push(action.course);
			return new_state;
		case 'UNHOVER_COURSE':
			let new_s = $.extend({}, state);
			new_s.items[state.current].courses.pop();
			return new_s;
		default:
			return state;
	}
}
