import * as ActionTypes from '../constants/actionTypes';

const defaultState = {
  current: -1, // semester.current indexes into semester.all
  all: [], // semester.all is a list of {name, year} objects
  exams: [], // semester.exams is a list of indices into semester.all
};

const semester = (state = defaultState, action) => {
  switch (action.type) {
    case ActionTypes.INIT_STATE:
      return Object.assign({}, state, {
        current: parseInt(action.data.currentSemester, 10),
        all: action.data.allSemesters,
        exams: action.data.examSupportedSemesters,
      });
    case ActionTypes.SET_SEMESTER:
      return Object.assign({}, state, { current: action.semester });
    default:
      return state;
  }
};

export const getCurrentSemester = state => state.all[state.current];

export default semester;
