import update from 'react/lib/update';
let initialState = {isFetching: false, items: [{courses: []}], active: 0};

export const timetables = (state = initialState, action) => {
	switch(action.type) {
		case 'REQUEST_TIMETABLES':
			return Object.assign({}, state, {isFetching: true});
		case 'RECEIVE_TIMETABLES':
			let timetables = action.timetables.length > 0 ? action.timetables : [{courses: []}];
			return {
				isFetching: false, 
				items: timetables,
				active: 0
			};
		case 'HOVER_COURSE':
			let new_course = Object.assign({}, action.course, { fake: true });
			let current_courses = state.items[state.active].courses;
			// if there's already a hovered course on the timetable, or
			// if the user is hovering over a section that they've already added 
			// to their timetable, we don't want to show any new slots on the timetable
			if (current_courses.some(course => course.fake || 
			(course.code == new_course.code && course.enrolled_sections.indexOf(new_course.section) > -1))) { // only one "fake" (hovered course) at a time
				return state;
			}
			// using react's update function, which allows syntactic sugar to update
			// nested components. here, we are updating state.items[state.active].courses, by concatenating it with [new_course] (i.e. adding new_course to it)
			// see https://facebook.github.io/react/docs/update.html
			return update(state, {
				items: {
					[state.active]: {
						courses: {
							$push: [new_course]
						}
					}
				}
			});
			
		case 'UNHOVER_COURSE':
			// find fake course index; delete it
			let fakeCourseIndex = state.items[state.active].courses.findIndex(c => c.fake);
			if (fakeCourseIndex < 0) { return state; }
			return update(state, {
				items:	{
					[state.active]: {
						courses: {
							$splice: [[fakeCourseIndex]]
						}
					}
				}
			});
		case 'CHANGE_ACTIVE_TIMETABLE':
			return Object.assign({}, state, { active: action.new_active });
		case 'ALERT_CONFLICT':
			return Object.assign({}, state, {isFetching: false});
		default:
			return state;
	}
}
