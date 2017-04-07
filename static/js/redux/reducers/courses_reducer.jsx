import * as ActionTypes from "../constants/actionTypes.jsx";

let initialState = {isFetching: false, items: [], lastUpdated: ""};
export const courses = (state = initialState, action) => {
    switch (action.type) {
        case ActionTypes.RECEIVE_COURSES:
            return {
                isFetching: false,
                items: action.courses,
                lastUpdated: action.lastUpdated
            };
        case ActionTypes.REQUEST_COURSES:
            return {
                isFetching: true,
                items: []
            };
        default:
            return state;
    }
}
