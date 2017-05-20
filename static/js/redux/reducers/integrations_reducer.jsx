import * as ActionTypes from '../constants/actionTypes';

const integrations = (state = [], action) => {
  switch (action.type) {
    case ActionTypes.INIT_STATE:
      return action.data.studentIntegrations;
    default:
      return state;
  }
};

export default integrations;
