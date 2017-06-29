import { createSelector } from 'reselect';
import { saveLocalActiveIndex } from '../util';
import * as ActionTypes from '../constants/actionTypes';

export const initialState = {
  isFetching: false,
  items: [{ courses: [], has_conflict: false }],
  hovered: null,
  ids: ['empty'],
  active: 0,
  loadingCachedTT: true,
  lastSlotAdded: null, // either int (course id), object (custom slots state), or null
};

const timetables = (state = initialState, action) => {
  switch (action.type) {

    case ActionTypes.LOADING_CACHED_TT:
      return Object.assign({}, state, { loadingCachedTT: true });

    case ActionTypes.CACHED_TT_LOADED:
      return Object.assign({}, state, { loadingCachedTT: false });

    case ActionTypes.REQUEST_TIMETABLES:
      return Object.assign({}, state, { isFetching: true });

    case ActionTypes.SET_SEMESTER:
      return Object.assign({}, state, { isFetching: true });

    case ActionTypes.RECEIVE_TIMETABLES: {
      const actionTimetables = action.timetables.length > 0 ? action.timetables : [{
        courses: [],
        has_conflict: false,
      }];
      return {
        isFetching: false,
        items: actionTimetables,
        hovered: null,
        ids: ('response' in action) ? action.response.result : ['empty'],
        active: 0,
      };
    }

    case ActionTypes.RECEIVE_COURSES:
      return Object.assign({}, state, { isFetching: false });

    case ActionTypes.HOVER_SECTION:
      return { ...state, hovered: action.slot };

    case ActionTypes.UNHOVER_SECTION:
      return { ...state, hovered: null };

    case ActionTypes.CHANGE_ACTIVE_TIMETABLE:
      saveLocalActiveIndex(action.newActive);
      return Object.assign({}, state, { active: action.newActive });

    case ActionTypes.ALERT_CONFLICT:
      return Object.assign({}, state, { isFetching: false });

    case ActionTypes.UPDATE_LAST_COURSE_ADDED:
      return Object.assign({}, state, { lastSlotAdded: action.course });

    default:
      return state;
  }
};

export const getActiveTTIndex = state => state.active;

export const getAllTTs = state => state.items;

export const getActiveTimetable = state => state.ids[state.active];

export const getHoveredSlots = state => (state.hovered ? [state.hovered] : []);

export const getActiveTT = createSelector(
  [getActiveTTIndex, getAllTTs],
  (activeIndex, allTTs) => allTTs[activeIndex],
);

export default timetables;
