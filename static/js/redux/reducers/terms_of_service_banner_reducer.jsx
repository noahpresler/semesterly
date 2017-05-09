import * as ActionTypes from '../constants/actionTypes';

const termsOfServiceBanner = (state = { isVisible: false }, action) => {
  switch (action.type) {
    case ActionTypes.TRIGGER_TOS_BANNER:
      console.log('reducer received');
      return { isVisible: true };
    default:
      return state;
  }
};

export default termsOfServiceBanner;
