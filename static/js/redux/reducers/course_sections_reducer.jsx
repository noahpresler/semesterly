import { saveLocalTimetable } from '../util.jsx';
// we need "active" (the active timetable's index) to properly save timetables.
// so, the courseSections variable we care about is instead found in 
// state.objects
export const courseSections = (state = { objects: {}, active: 0 }, action) => {
	switch(action.type) {
		case 'RECEIVE_COURSE_SECTIONS':
			saveLocalTimetable(action.courseSections, state.active);
			return Object.assign({}, state, { objects: action.courseSections });
		case 'CHANGE_ACTIVE_TIMETABLE':
			saveLocalTimetable(state.courseSections, action.newActive);
			return Object.assign({}, state, { active: action.newActive });
		default:
			return state;
	}
}
