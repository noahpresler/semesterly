import merge from 'lodash/merge';

const entities = (state = {}, action) => {
  if (action.response && action.response.entities) {
    return merge(state, action.response.entities);
  }
  return state;
};

export const getSectionsForCourse = (state, course) =>
  course.sections.map(sectionId => state.sections[sectionId]);

export const getCourseById = (state, id) => state.courses[id];

// TODO use denormalize from normalizr
export const getDenormCourseById = (state, id) => {
  let course = getCourseById(state, id);
  let sections = getSectionsForCourse(state, course);
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

export default entities;
