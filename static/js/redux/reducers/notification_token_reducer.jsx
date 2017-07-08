import * as ActionTypes from '../constants/actionTypes';

const notificationToken = (state = { hasToken: false }, action) => {
  switch (action.type) {
    case ActionTypes.TOKEN_REGISTERED:
      return { hasToken: true };
    case ActionTypes.UNREGISTER_TOKEN:
      return { hasToken: false };
    default:
      return state;
  }
};

export default notificationToken;
