import * as ActionTypes from '../constants/actionTypes';

const termsOfServiceModal = (state = { isVisible: false }, action) => {
  switch (action.type) {
    case ActionTypes.TRIGGER_TOS_MODAL:
      return { isVisible: true };
    case ActionTypes.CLOSE_TOS_MODAL:
      return { isVisible: false };
    default:
      return state;
  }
};

export default termsOfServiceModal;
