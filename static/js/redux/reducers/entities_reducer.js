import merge from 'lodash/merge';

const entities = (state = {}, action) => {
  if (action.response && action.response.entities) {
    return merge(state, action.response.entities);
  }
  return state;
};

export default entities;
