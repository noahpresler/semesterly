import * as ActionTypes from '../constants/actionTypes';

const semesterIndex = (state = 0, action) => {
  switch (action.type) {
    case ActionTypes.SET_SEMESTER:
      return action.semester;
    default:
      return state;
  }
};

export default semesterIndex;
