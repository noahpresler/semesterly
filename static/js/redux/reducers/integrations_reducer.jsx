import * as ActionTypes from '../constants/actionTypes';

const integrations = (state = [], action) => {
  switch (action.type) {
    case ActionTypes.SET_INTEGRATIONS:
      return action.studentIntegrations;
    default:
      return state;
  }
};

export default integrations;
