import merge from 'lodash/merge';
import pick from 'lodash/pick';

// TODO: garbage collect (e.g. clear when changing semesters)
const entities = (state = {}, action) => {
  if (action.response && action.response.entities) {
    return merge(state, action.response.entities);
  }
  return state;
};

const getSectionById = (state, id) => state.sections[id];

const getSlotsForSection = (state, section) =>
  section.offering_set.map(slotId => state.offering_set[slotId]);

// TODO use denormalize from normalizr
const getDenormSectionById = (state, id) => {
  let section = getSectionById(state, id);
  let offering_set = getSlotsForSection(state, section);
  return { ...section, offering_set }
};

const getCourseById = (state, id) => state.courses[id];

const getDenormSectionsForCourse = (state, course) =>
  course.sections.map(sectionId => getDenormSectionById(state, sectionId));

// TODO use denormalize from normalizr
export const getDenormCourseById = (state, id) => {
  if (!('courses' in state)) {
    return {};
  };
  let course = getCourseById(state, id);
  let sections = getDenormSectionsForCourse(state, course);
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

export const getTimetable = (state, id) => {
  let timetable = state.timetables[id];
  return {
    ...timetable,
    courses: timetable.courses.map(courseCode => getDenormCourseById(state, id)),
  };
};

export const getFromDenormTimetable = (timetable, fields) => {
  if (!('courses' in timetable) || !('sections' in timetable.courses[0])) {
    throw "Timetable must be denormalized before being passed to getFromDenormTimetable";
  }
  return {
    ...pick(timetable, fields.timetables),
    courses: timetable.courses.map(course => ({
      ...pick(course, fields.courses),
      sections: course.sections.map(section => ({
          ...pick(section, fields.sections),
          offerings: section.offering_set.map(offering => ({
            ...pick(offering, fields.offerings),
          })),
      })),
    })),
  }
};

export default entities;
