const entities = (state = {}, action) => {
  if (action.response && action.response.entities) {
    return _.merge(state, action.response.entities);
  }
  return state;
};

export default entities;