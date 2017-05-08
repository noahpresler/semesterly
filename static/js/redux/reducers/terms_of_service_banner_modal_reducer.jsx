import * as ActionTypes from '../constants/actionTypes';

const termsOfServiceBannerModal = (state = { isVisible: false }, action) => {
  switch (action.type) {
    case ActionTypes.TRIGGER_TOS_BANNER_MODAL:
      return { isVisible: true };
    default:
      return state;
  }
};

export default termsOfServiceBannerModal;