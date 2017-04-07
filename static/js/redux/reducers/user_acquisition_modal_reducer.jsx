import * as ActionTypes from "../constants/actionTypes.jsx";

export const userAcquisitionModal = (state = {isVisible: false}, action) => {
    switch (action.type) {
        case ActionTypes.TOGGLE_ACQUISITION_MODAL:
            return {isVisible: !state.isVisible};
        case ActionTypes.TRIGGER_ACQUISITION_MODAL:
            return {isVisible: true};
        default:
            return state;
    }
}