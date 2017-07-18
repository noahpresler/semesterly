import * as ActionTypes from '../constants/actionTypes';

const peerModal = (state = { isVisible: false, isLoading: false }, action) => {
  switch (action.type) {
    case ActionTypes.TOGGLE_PEER_MODAL:
      return { ...state, isVisible: !state.isVisible };
    case ActionTypes.PEER_MODAL_LOADING:
      return { ...state, isLoading: true };
    case ActionTypes.PEER_MODAL_LOADED:
      return { ...state, isLoading: false };
    default:
      return state;
  }
};

export default peerModal;
