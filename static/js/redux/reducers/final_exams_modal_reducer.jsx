import * as ActionTypes from "../constants/actionTypes.jsx";

export const finalExamsModal = (state = {isVisible: false, isLoading: true, finalExams: null}, action) => {
    switch (action.type) {
        case ActionTypes.HIDE_FINAL_EXAMS_MODAL:
            return Object.assign({}, state, {isVisible: false});
        case ActionTypes.SHOW_FINAL_EXAMS_MODAL:
            return Object.assign({}, state, {isVisible: true});
        case ActionTypes.FETCH_FINAL_EXAMS:
            return Object.assign({}, state, {isLoading: true, finalExams: null});
        case ActionTypes.RECIEVE_FINAL_EXAMS:
            return Object.assign({}, state, {isLoading: false, finalExams: action.json});
        case ActionTypes.RECEIVE_TIMETABLES:
            return Object.assign({}, state, {finalExams: null});
        default:
            return state;
    }
}