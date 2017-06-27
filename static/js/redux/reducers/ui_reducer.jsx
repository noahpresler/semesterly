import range from 'lodash/range';
import COLOUR_DATA from '../constants/colours';
import * as ActionTypes from '../constants/actionTypes';

const initialState = {
  searchHover: 0,
  courseToColourIndex: {},
  uses12HrTime: false,
  highlightNotifs: false, // add yellow styling to notifications
};

export const getNextAvailableColour = state =>
  range(COLOUR_DATA.length).find(i => !Object.values(state.courseToColourIndex).some(x => x === i));

const ui = (state = initialState, action) => {
  switch (action.type) {
    case ActionTypes.INIT_STATE:
      return Object.assign({}, state, { uses12HrTime: action.data.uses12HrTime });
    case ActionTypes.HOVER_SEARCH_RESULT:
      return Object.assign({}, state, { searchHover: action.position });
    case ActionTypes.RECEIVE_TIMETABLES: {
      const courses = action.timetables.length > 0 ? action.timetables.courses : [];

      // TODO: remove one of saving/preset, using both is redundant. rename to recalculateColours?
      let courseToColourIndex = state.courseToColourIndex;
      if (!action.saving && action.preset) {
        courseToColourIndex = {};
      }

      courses.forEach((course) => {
        courseToColourIndex[course.id] =
          courseToColourIndex[course.id] || getNextAvailableColour(courseToColourIndex);
      });

      return { ...state, courseToColourIndex };
    }
    case ActionTypes.SET_HIGHLIGHT_NOTIFS:
      return Object.assign({}, state, { highlightNotifs: action.highlightNotifs });
    default:
      return state;
  }
};

export default ui;
