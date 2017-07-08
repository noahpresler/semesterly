import range from 'lodash/range';
import COLOUR_DATA from '../constants/colours';
import * as ActionTypes from '../constants/actionTypes';

const initialState = {
  searchHover: 0,
  courseToColourIndex: {},
  uses12HrTime: false,
  highlightNotifs: false, // add yellow styling to notifications
};

const ui = (state = initialState, action) => {
  switch (action.type) {
    case ActionTypes.INIT_STATE:
      return Object.assign({}, state, { uses12HrTime: action.data.uses12HrTime });
    case ActionTypes.HOVER_SEARCH_RESULT:
      return Object.assign({}, state, { searchHover: action.position });
    case ActionTypes.RECEIVE_TIMETABLES: {
      // update slot colours based on new timetables
      const timetables = action.timetables.length > 0 ? action.timetables : [{
        courses: [],
        has_conflict: false,
      }];
      const existingCourseToColour = !action.saving && action.preset
        ? {} : state.courseToColourIndex;
      const courseToColourIndex = {};
      const usedColourIndices = Object.values(existingCourseToColour);
      for (let i = 0; i < timetables[0].courses.length; i++) {
        const cid = timetables[0].courses[i].id;
        if (cid in existingCourseToColour) { // course already has a colour
          courseToColourIndex[cid] = existingCourseToColour[cid];
        } else {
          const newUsed = Object.values(courseToColourIndex);
          // find unused colourIndex
          courseToColourIndex[cid] = range(COLOUR_DATA.length).find(idx =>
            !usedColourIndices.concat(newUsed).some(x => x === idx),
          );
        }
      }
      return Object.assign({}, state, { courseToColourIndex });
    }
    case ActionTypes.SET_HIGHLIGHT_NOTIFS:
      return Object.assign({}, state, { highlightNotifs: action.highlightNotifs });
    default:
      return state;
  }
};

export default ui;
