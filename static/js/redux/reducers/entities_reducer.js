import merge from 'lodash/merge';

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

export default entities;
