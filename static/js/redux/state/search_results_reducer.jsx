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

import * as ActionTypes from '../constants/actionTypes';

const defaultState = {
  isFetching: false,
  items: [],
  // assign each search request a sequence number to avoid overwriting more recent results
  seqNumber: 0,
};

const searchResults = (state = defaultState, action) => {
  switch (action.type) {
    case ActionTypes.RECEIVE_SEARCH_RESULTS:
      return {
        ...state,
        isFetching: false,
        items: action.response.result,
      };
    case ActionTypes.REQUEST_COURSES:
      return {
        isFetching: true,
        items: state.items,
        seqNumber: state.seqNumber + 1,
      };
    default:
      return state;
  }
};

export const getSearchResultId = (state, index) => state.items[index];

export const getSearchResultIds = state => state.items;

export default searchResults;
