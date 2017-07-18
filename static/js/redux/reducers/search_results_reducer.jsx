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
