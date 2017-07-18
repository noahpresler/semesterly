import without from 'lodash/without';
import * as ActionTypes from '../constants/actionTypes';

// TODO: add UI for adjusting num required
const optionalCourses = (state = { courses: [], numRequired: 0 }, action) => {
  switch (action.type) {
    case ActionTypes.ADD_REMOVE_OPTIONAL_COURSE: {
      if (state.courses.find(c => c === action.newCourseId)) {
        return {
          ...state,
          courses: without(state.courses, action.newCourseId),
          numRequired: state.numRequired - 1,
        };
      }
      return {
        ...state,
        courses: state.courses.concat([action.newCourseId]),
        numRequired: state.numRequired + 1,
      };
    }
    case ActionTypes.REMOVE_OPTIONAL_COURSE_BY_ID: {
      return {
        ...state,
        courses: without(state.courses, action.newCourseId),
        numRequired: state.numRequired - 1,
      };
    }
    case ActionTypes.CLEAR_OPTIONAL_COURSES:
      return { courses: [], numRequired: 0 };
    default:
      return state;
  }
};

export default optionalCourses;
