import * as ActionTypes from "../constants/actionTypes";

export const textbookModal = (state = {isVisible: false}, action) => {
    switch (action.type) {
        case ActionTypes.TOGGLE_TEXTBOOK_MODAL:
            return {isVisible: !state.isVisible};
        case ActionTypes.TRIGGER_TEXTBOOK_MODAL:
            return {isVisible: true};
        default:
            return state;
    }
}