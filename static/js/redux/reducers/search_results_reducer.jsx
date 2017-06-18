import * as ActionTypes from '../constants/actionTypes';

const searchResults = (state = { isFetching: false, items: [] }, action) => {
  switch (action.type) {
    case ActionTypes.RECEIVE_COURSES:
      return {
        isFetching: false,
        items: action.response.result,
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

export const getSearchResultId = (state, index) => state.items[index];

export const getSearchResultIds = state => state.items;

export default searchResults;
