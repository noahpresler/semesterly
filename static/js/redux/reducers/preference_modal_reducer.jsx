import * as ActionTypes from '../constants/actionTypes';

const preferenceModal = (state = { isVisible: false }, action) => {
  switch (action.type) {
    case ActionTypes.TOGGLE_PREFERENCE_MODAL:
      return { isVisible: !state.isVisible };
    default:
      return state;
  }
};

export default preferenceModal;
