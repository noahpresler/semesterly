/*
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
*/

import * as ActionTypes from "../constants/actionTypes";

const explorationModal = (
  state = {
    isVisible: false,
    advancedSearchResults: [],
    isFetching: false,
    active: 0,
    schoolInfoLoaded: false,
    page: 1,
  },
  action
) => {
  switch (action.type) {
    case ActionTypes.SHOW_EXPLORATION_MODAL:
      return Object.assign({}, state, { isVisible: true });
    case ActionTypes.HIDE_EXPLORATION_MODAL:
      return Object.assign({}, state, { isVisible: false });
    case ActionTypes.REQUEST_ADVANCED_SEARCH_RESULTS:
      return Object.assign({}, state, { isFetching: true });
    case ActionTypes.RECEIVE_ADVANCED_SEARCH_RESULTS: {
      let results = action.payload.result;
      if (state.page > 1) {
        if (results) {
          results = [...state.advancedSearchResults].concat(results);
          return Object.assign({}, state, {
            advancedSearchResults: results,
            isFetching: false,
          });
        }
        return Object.assign({}, state, { isFetching: false });
      }
      return Object.assign({}, state, {
        advancedSearchResults: results,
        isFetching: false,
        active: 0,
      });
    }
    case ActionTypes.SET_ACTIVE_ADV_SEARCH_RESULT:
      return Object.assign({}, state, { active: action.active });
    case ActionTypes.SET_COURSE_REACTIONS:
      if (state.isVisible) {
        const searchResults = [...state.advancedSearchResults];
        searchResults[state.active].reactions = action.reactions;
        return Object.assign({}, state, { advancedSearchResults: searchResults });
      }
      return state;
    case ActionTypes.REQUEST_SCHOOL_INFO:
      return Object.assign({}, state, { schoolInfoLoaded: true });
    case ActionTypes.RECEIVE_SCHOOL_INFO:
      return Object.assign({}, state, { schoolInfoLoaded: false });
    case ActionTypes.PAGINATE_ADVANCED_SEARCH_RESULTS:
      return Object.assign({}, state, { page: state.page + 1 });
    case ActionTypes.CLEAR_ADVANCED_SEARCH_PAGINATION:
      return Object.assign({}, state, { page: 1 });
    default:
      return state;
  }
};

export const getAdvancedSearchResultIds = (state) => state.advancedSearchResults;

export default explorationModal;
