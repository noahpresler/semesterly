import update from 'react/lib/update';
import { saveLocalActiveIndex } from '../util.jsx';

let initialState = { isFetching: false, items: [{courses: [], has_conflict: false}], active: 0, loadingCachedTT: true};

export const timetables = (state = initialState, action) => {

	switch(action.type) {

		case 'LOADING_CACHED_TT':
			return Object.assign({}, state, {loadingCachedTT: true});

		case 'CACHED_TT_LOADED':
			return Object.assign({}, state, {loadingCachedTT: false});
		
		case 'REQUEST_TIMETABLES':
			return Object.assign({}, state, {isFetching: true});

		case 'RECEIVE_TIMETABLES':
			let timetables = action.timetables.length > 0 ? action.timetables : [{courses: [], has_conflict: false}];
			return {
				isFetching: false, 
				items: timetables,
				active: 0
			};

		case 'HOVER_COURSE':
			// add the course to the current timetable, but mark it as "fake", so we can
			// identify it to remove upon unhover
			let newCourse = Object.assign({}, action.course, { fake: true });
			newCourse.enrolled_sections = [];
			let currentCourses = state.items[state.active].courses;
			// if there's already a hovered course on the timetable, or
			// if the user is hovering over a section that they've already added 
			// to their timetable, we don't want to show any new slots on the timetable
			if (currentCourses.some(course => course.fake)) { // only one "fake" (hovered course) at a time
				return state;
			}
			let oldCourseIndex = currentCourses.findIndex(course => course.id === newCourse.id);
			if (oldCourseIndex > -1) { // we want to remove old 'section_type' slots and add the new 'section_type' slots for this course
				// store a new property 'oldSlots' for the course, representing the slots that we're about to remove
				// (i.e. slots of the same section_type, since we want to show the new slots of that section_type as specified by the hovered course)
				// remove those old slots from the 'slots' property; then push the hovered course (which only contains the new section_type slots) to the courses array, which gives, collectively for the course, all the required slots (old tutorials gone, new tutorials added, as an example, in the case of UofT)
				let newSectionType = newCourse.slots[0].section_type;

				let oldCourse = Object.assign({}, currentCourses[oldCourseIndex]);
				let oldSlots = oldCourse.slots.filter(slot => slot.section_type == newSectionType);
				oldCourse.oldSlots = oldSlots;

				let filteredSlots = oldCourse.slots.filter(slot => slot.section_type != newSectionType);
				oldCourse.slots = filteredSlots;
				let newCourses = [...currentCourses, newCourse]
				
				newCourses[oldCourseIndex] = oldCourse;

				return update(state, {
					items: {
						[state.active]: {
							courses: {
								$set: newCourses
							}
						}
					}
				});

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
			let curCourses = state.items[state.active].courses;
			let fakeCourseIndex = curCourses.findIndex(c => c.fake);
			if (fakeCourseIndex < 0) { return state; }
			let prevCourseIndex = curCourses.findIndex(c => c.id === curCourses[fakeCourseIndex].id && !c.fake)
			if (prevCourseIndex === -1) { // removing a course that isn't already in roster
				return update(state, {
					items:	{
						[state.active]: {
							courses: {
								$splice: [[fakeCourseIndex]]
							}
						}
					}
				});
			}
			else { // course is already in roster; remove the entry from curCourses that represents the "fake"
			// slots, and replace the actual entry's slotss with its original slots
				let prevCourse = Object.assign({}, curCourses[prevCourseIndex]);
				prevCourse.slots = prevCourse.slots.concat(prevCourse.oldSlots);
				let newCourses = curCourses.slice(0, fakeCourseIndex);
				newCourses[prevCourseIndex] = prevCourse;
				return update(state, {
					items:	{
						[state.active]: {
							courses: {
								$set: newCourses
							}
						}
					}
				});
			}

		case 'CHANGE_ACTIVE_TIMETABLE':
			saveLocalActiveIndex(action.newActive);
			return Object.assign({}, state, { active: action.newActive });

		case 'ALERT_CONFLICT':
			return Object.assign({}, state, { isFetching: false });

		default:
			return state;
	}
}
