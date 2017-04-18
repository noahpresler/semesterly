import * as ActionTypes from '../constants/actionTypes';

// we need "active" (the active timetable's index) to properly save timetables.
// so, the courseSections variable we care about is instead found in
// state.objects
const courseSections = (state = { objects: {} }, action) => {
  switch (action.type) {
    case ActionTypes.RECEIVE_COURSE_SECTIONS:
      return Object.assign({}, state, { objects: action.courseSections });
    default:
      return state;
  }
};

export default courseSections;
