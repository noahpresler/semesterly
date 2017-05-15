import * as ActionTypes from '../constants/actionTypes';

const defaultState = {
  current: -1, // semester.current indexes into semester.all
  all: [], // semester.all is a list of {name, year} objects
  exams: [], // semester.exams is a list of indices into semester.all
};

const semester = (state = defaultState, action) => {
  switch (action.type) {
    case ActionTypes.SET_SEMESTER:
      return Object.assign({}, state, { current: action.semester });
    case ActionTypes.SET_AVAIL_SEMESTERS:
      return Object.assign({}, state, { all: action.availSemesters });
    case ActionTypes.SET_EXAM_SEMESTERS:
      return Object.assign({}, state, { exams: action.exams });
    default:
      return state;
  }
};

export const currSem = state => state.all[state.current];

export default semester;
