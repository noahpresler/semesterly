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

export const getSectionTypeToSections = (searchResult) => {
  const sectionTypeToSections = {};
  searchResult.sections.forEach((section) => {
    if (!(section.section_type in sectionTypeToSections)) {
      sectionTypeToSections[section.section_type] = [];
    }
    sectionTypeToSections[section.section_type].push(section);
  });
  console.log(sectionTypeToSections);
  return sectionTypeToSections;
};

export default searchResults;
