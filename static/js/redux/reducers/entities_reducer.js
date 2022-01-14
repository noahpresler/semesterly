import merge from 'lodash/merge';
import uniq from 'lodash/uniq';
import flatMap from 'lodash/flatMap';
import * as ActionTypes from '../constants/actionTypes';

const entities = (state = {}, action) => {
  switch (action.type) {
    case ActionTypes.SET_COURSE_REACTIONS:
      if (state.id === null) {
        return state;
      }
      return Object.assign({}, state,
        {
          courses: Object.assign({}, state.courses, {
            [action.id]: { ...state.courses[action.id], reactions: action.reactions },
          }),
        });
    default:
      if (action.response && action.response.entities) {
        return merge({}, state, action.response.entities);
      }
      return state;
  }
};

// OFFERING SELECTORS
const getOfferingById = (state, id) => state.offering_set[id];

// SECTION SELECTORS
const getSectionById = (state, id) => state.sections[id];

const getSlotsForSection = (state, section) =>
  section.offering_set.map(offering => getOfferingById(state, offering));

// TODO use denormalize from normalizr
const getDenormSectionById = (state, id) => {
  const section = getSectionById(state, id);
  const offerings = getSlotsForSection(state, section);
  return { ...section, offering_set: offerings };
};

// COURSE SELECTORS
const getCourseById = (state, id) => state.courses[id];

const getDenormSectionsForCourse = (state, course) =>
  course.sections.map(sectionId => getDenormSectionById(state, sectionId));

// TODO use denormalize from normalizr
export const getDenormCourseById = (state, id) => {
  if (!('courses' in state)) {
    return {};
  }
  const course = getCourseById(state, id);
  const sections = getDenormSectionsForCourse(state, course);
  return { ...course, sections };
};

export const getSectionTypeToSections = (denormCourse) => {
  if (!('sections' in denormCourse)) { // empty course (only happens on inital CourseInfo state)
    return {};
  }
  const sectionTypeToSections = {};
  denormCourse.sections.forEach((section) => {
    if (!(section.section_type in sectionTypeToSections)) {
      sectionTypeToSections[section.section_type] = [];
    }
    sectionTypeToSections[section.section_type].push(section);
  });
  return sectionTypeToSections;
};

export const getTextbooksFromCourse = course =>
  flatMap(Object.keys(course.textbooks), sectionCode => course.textbooks[sectionCode]);

// TIMETABLE SELECTORS
//    SLOT SELECTORS
export const getDenormSlot = (state, slot) => ({
  ...slot,
  course: getCourseById(state, slot.course),
  section: getSectionById(state, slot.section),
  offerings: slot.offerings.map(offering => getOfferingById(state, offering)),
});

export const getCourseIdsFromSlots = slots => uniq(slots.map(slot => slot.course));

export const getCoursesFromSlots = (state, slots) =>
  getCourseIdsFromSlots(slots).map(cid => getDenormCourseById(state, cid));

export const getDenormTimetable = (state, timetable) => ({
  ...timetable,
  slots: timetable.slots.map(slot => getDenormSlot(state, slot)),
});

export const getTimetableCourses = (state, timetable) => {
  const courseIds = uniq(timetable.slots.map(slot => slot.course));
  return courseIds.map(courseId => getCourseById(state, courseId));
};

export const getTimetableDenormCourses = (state, timetable) => {
  const courseIds = uniq(timetable.slots.map(slot => slot.course));
  return courseIds.map(courseId => getDenormCourseById(state, courseId));
};

export const getMaxEndHour = function getLatestSlotEndHourFromTimetable(timetable) {
  let maxEndHour = 17;
  timetable.slots.forEach((slot) => {
    slot.offerings.forEach((offering) => {
      const endHour = parseInt(offering.time_end.split(':')[0], 10) + 1;
      maxEndHour = Math.max(maxEndHour, endHour);
    });
  });
  return maxEndHour;
};

export default entities;
