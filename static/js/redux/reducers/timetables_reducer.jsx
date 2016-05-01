import update from 'react/lib/update';
let initialState = { isFetching: false, items: [{courses: []}], active: 0 };

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
			// add the course to the current timetable, but mark it as "fake", so we can
			// identify it to remove upon unhover
			let newCourse = Object.assign({}, action.course, { fake: true });
			let currentCourses = state.items[state.active].courses;
			// if there's already a hovered course on the timetable, or
			// if the user is hovering over a section that they've already added 
			// to their timetable, we don't want to show any new slots on the timetable
			if (currentCourses.some(course => course.fake || 
			(course.code == newCourse.code && course.enrolled_sections.indexOf(newCourse.section) > -1))) { // only one "fake" (hovered course) at a time
				return state;
			}
			// here, we are using React's update function, which allows syntactic sugar to update
			// nested components. we are updating state.items[state.active].courses, by concatenating it with [newCourse] (i.e. adding newCourse to it)
			// see https://facebook.github.io/react/docs/update.html
			return update(state, {
				items: {
					[state.active]: {
						courses: {
							$push: [newCourse]
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
			return Object.assign({}, state, { active: action.newActive });

		case 'ALERT_CONFLICT':
			return Object.assign({}, state, { isFetching: false });

		default:
			return state;
	}
}
