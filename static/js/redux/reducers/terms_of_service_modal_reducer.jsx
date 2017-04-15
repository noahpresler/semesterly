import * as ActionTypes from "../constants/actionTypes.jsx";

export const termsOfServiceModal = (state = {isVisible: false}, action) => {
    switch (action.type) {
        case ActionTypes.TRIGGER_TOS_MODAL:
            return {isVisible: true};
        default:
            return state;
    }
}