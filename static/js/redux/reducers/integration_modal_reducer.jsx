import * as ActionTypes from '../constants/actionTypes';

const initialState = {
  isVisible: false,
  id: null,
  enabled: false,
  integration_id: null,
  studentIntegrations: [],
};

const integrationModal = (state = initialState, action) => {
  switch (action.type) {
    case ActionTypes.TOGGLE_INTEGRATION_MODAL:
      return Object.assign({}, state, { isVisible: !state.isVisible, id: action.id });
    case ActionTypes.OPEN_INTEGRATION_MODAL:
      return Object.assign({}, state, {
        enabled: action.enabled,
        isVisible: true,
        id: action.id,
        integration_id: action.integration_id,
      });
    default:
      return state;
  }
};

export default integrationModal;
