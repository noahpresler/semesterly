import * as ActionTypes from "../constants/actionTypes.jsx";

export const classmates = (state = {courseToClassmates: [], isFetching: false}, action) => {
    switch (action.type) {
        case ActionTypes.CLASSMATES_RECEIVED:
            return Object.assign({}, state, {courseToClassmates: action.courses, isFetching: false});
        case ActionTypes.REQUEST_CLASSMATES:
            return Object.assign({}, state, {isFetching: true});
        default:
            return state;
    }
}
