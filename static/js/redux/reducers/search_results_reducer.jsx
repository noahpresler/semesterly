import * as ActionTypes from '../constants/actionTypes';

const searchResults = (state = { isFetching: false, items: [] }, action) => {
  switch (action.type) {
    case ActionTypes.RECEIVE_COURSES:
      return {
        isFetching: false,
        items: action.courses,
      };
    case ActionTypes.REQUEST_COURSES:
      return {
        isFetching: true,
        items: state.items,
      };
    default:
      return state;
  }
};

export const getSearchResult = (state, index) => state.items[index];

export const getSectionTypeToSections = (course) => {
  if (!('sections' in course)) { // empty course (only happens on inital CourseInfo state)
    return {};
  }
  const sectionTypeToSections = {};
  course.sections.forEach((section) => {
    if (!(section.section_type in sectionTypeToSections)) {
      sectionTypeToSections[section.section_type] = [];
    }
    sectionTypeToSections[section.section_type].push(section);
  });
  return sectionTypeToSections;
};

export default searchResults;
