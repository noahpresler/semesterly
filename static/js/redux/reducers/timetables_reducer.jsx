import update from 'react/lib/update';
import { createSelector } from 'reselect';
import { saveLocalActiveIndex } from '../util';
import * as ActionTypes from '../constants/actionTypes';

export const initialState = {
  isFetching: false,
  items: [{ courses: [], has_conflict: false }],
  ids: [],
  active: 0,
  loadingCachedTT: true,
  lastSlotAdded: null, // either int (course id), object (custom slots state), or null
};

const timetables = (state = initialState, action) => {
  switch (action.type) {

    case ActionTypes.LOADING_CACHED_TT:
      return Object.assign({}, state, { loadingCachedTT: true });

    case ActionTypes.CACHED_TT_LOADED:
      return Object.assign({}, state, { loadingCachedTT: false });

    case ActionTypes.REQUEST_TIMETABLES:
      return Object.assign({}, state, { isFetching: true });

    case ActionTypes.SET_SEMESTER:
      return Object.assign({}, state, { isFetching: true });

    case ActionTypes.RECEIVE_TIMETABLES: {
      const actionTimetables = action.timetables.length > 0 ? action.timetables : [{
        courses: [],
        ids: [],
        has_conflict: false,
      }];
      return {
        isFetching: false,
        items: actionTimetables,
        ids: action.response.result,
        active: 0,
      };
    }

    case ActionTypes.RECEIVE_COURSES:
      return Object.assign({}, state, { isFetching: false });

    case ActionTypes.HOVER_COURSE: {
      // add the course to the current timetable, but mark it as "fake", so we can
      // identify it to remove upon unhover
      const newCourse = Object.assign({}, action.course, { fake: true });
      newCourse.enrolled_sections = [];
      const currentCourses = state.items[state.active].courses;

      // if there's already a hovered course on the timetable, or
      // if the user is hovering over a section that they've already added
      // to their timetable, we don't want to show any new slots on the timetable
      if (currentCourses.some(course => course.fake)) {
        // only one "fake" (hovered course) at a time
        return state;
      }
      const oldCourseIndex = currentCourses.findIndex(course => course.id === newCourse.id);
      if (oldCourseIndex > -1) {
        /**
        we want to remove old 'section_type' slots and add the new 'section_type' slots for this
        course. Store a new property 'oldSlots' for the course, representing the slots that we're
        about to remove (i.e. slots of the same section_type, since we want to show the new slots
        of that section_type as specified by the hovered course). Remove those old slots from the
        'slots' property; then push the hovered course (which only contains the new section_type
        slots) to the courses array, which gives, collectively for the course, all the required
        slots (old tutorials gone, new tutorials added, as an example, in the case of UofT)
         **/
        const newSectionType = newCourse.slots[0].section_type;

        const oldCourse = Object.assign({}, currentCourses[oldCourseIndex]);
        oldCourse.oldSlots = oldCourse.slots.filter(slot => slot.section_type === newSectionType);

        oldCourse.slots = oldCourse.slots.filter(slot => slot.section_type !== newSectionType);
        const newCourses = [...currentCourses, newCourse];

        newCourses[oldCourseIndex] = oldCourse;

        return update(state, {
          items: {
            [state.active]: {
              courses: {
                $set: newCourses,
              },
            },
          },
        });
      }

      /**
      here, we are using React's update function, which allows syntactic sugar to update
      nested components. we are updating state.items[state.active].courses, by concatenating
      it with [newCourse] (i.e. adding newCourse to it)
      see https://facebook.github.io/react/docs/update.html
       **/
      return update(state, {
        items: {
          [state.active]: {
            courses: {
              $push: [newCourse],
            },
          },
        },
      });
    }
    case ActionTypes.UNHOVER_COURSE: {
      // find fake course index; delete it
      const curCourses = state.items[state.active].courses;
      const fakeCourseIndex = curCourses.findIndex(c => c.fake);
      if (fakeCourseIndex < 0) {
        return state;
      }
      const prevCourseIndex = curCourses
        .findIndex(c => c.id === curCourses[fakeCourseIndex].id && !c.fake);

      if (prevCourseIndex === -1) { // removing a course that isn't already in roster
        return update(state, {
          items: {
            [state.active]: {
              courses: {
                $splice: [[fakeCourseIndex]],
              },
            },
          },
        });
      }

      // course is already in roster; remove the entry from curCourses that represents the "fake"
      // slots, and replace the actual entry's slotss with its original slots
      const prevCourse = Object.assign({}, curCourses[prevCourseIndex]);
      prevCourse.slots = prevCourse.slots.concat(prevCourse.oldSlots);
      const newCourses = curCourses.slice(0, fakeCourseIndex);
      newCourses[prevCourseIndex] = prevCourse;
      return update(state, {
        items: {
          [state.active]: {
            courses: {
              $set: newCourses,
            },
          },
        },
      });
    }
    case ActionTypes.CHANGE_ACTIVE_TIMETABLE:
      saveLocalActiveIndex(action.newActive);
      return Object.assign({}, state, { active: action.newActive });

    case ActionTypes.ALERT_CONFLICT:
      return Object.assign({}, state, { isFetching: false });

    case ActionTypes.UPDATE_LAST_COURSE_ADDED:
      return Object.assign({}, state, { lastSlotAdded: action.course });

    default:
      return state;
  }
};

export const getActiveTTIndex = state => state.active;

export const getAllTTs = state => state.items;

export const getTimetableIds = state => state.ids;

export const getActiveTimetableId = state => state.ids[state.active];

export const getActiveTT = createSelector(
  [getActiveTTIndex, getAllTTs],
  (activeIndex, allTTs) => allTTs[activeIndex],
);

export default timetables;
