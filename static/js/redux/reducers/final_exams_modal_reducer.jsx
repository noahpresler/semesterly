import * as ActionTypes from '../constants/actionTypes';

const finalExamsModal = (state = {
  isVisible: false,
  isLoading: true,
  finalExams: null,
  link: null,
  fromShare: false,
}, action) => {
  switch (action.type) {
    case ActionTypes.HIDE_FINAL_EXAMS_MODAL:
      return Object.assign({}, state, { isVisible: false, fromShare: false });
    case ActionTypes.SHOW_FINAL_EXAMS_MODAL:
      return Object.assign({}, state, { isVisible: true });
    case ActionTypes.FETCH_FINAL_EXAMS:
      return Object.assign({}, state, { isLoading: true, finalExams: null });
    case ActionTypes.RECIEVE_FINAL_EXAMS:
      return Object.assign({}, state, { isLoading: false, finalExams: action.json });
    case ActionTypes.RECEIVE_TIMETABLES:
      return Object.assign({}, state, { finalExams: null });
    case ActionTypes.RECIEVE_EXAMS_SHARE_LINK:
      return Object.assign({}, state, { link: action.link.link });
    case ActionTypes.SET_FINAL_EXAMS_SHARED:
      return Object.assign({}, state, { fromShare: true });
    default:
      return state;
  }
};

export default finalExamsModal;
