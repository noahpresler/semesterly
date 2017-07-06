import fetch from 'isomorphic-fetch';
import { normalize } from 'normalizr';
import { courseSchema } from '../schema';
import { getActiveTimetableCourses, getCurrentSemester } from '../reducers/root_reducer';
import { getCourseSearchEndpoint } from '../constants/endpoints';
import { getUserSavedTimetables, saveTimetable } from './user_actions';
import { nullifyTimetable } from './timetable_actions';
import * as ActionTypes from '../constants/actionTypes';
import { fetchCourseClassmates } from './modal_actions';
import { getSemester } from './school_actions';

export const requestCourses = () => ({ type: ActionTypes.REQUEST_COURSES });

export const receiveCourses = courses => ({
  type: ActionTypes.RECEIVE_COURSES,
  response: normalize(courses, [courseSchema]),
});

export const setSemester = semester => (dispatch, getState) => {
  const state = getState();

  if (state.userInfo.data.isLoggedIn) {
    dispatch(getUserSavedTimetables(state.semester.all[semester]));
  } else {
    dispatch(nullifyTimetable(dispatch));
  }

  dispatch({
    type: ActionTypes.SET_SEMESTER,
    semester,
  });
  dispatch(receiveCourses([]));
};

/*
 * Check whether the user is logged in and whether their timetable is up to date
 * and set semester if appropriate. Otherwise show an alert modal and save the
 * semester they were trying to switch to in the modal state.
 */
export const maybeSetSemester = semester => (dispatch, getState) => {
  const state = getState();

  if (semester === state.semester.current) {
    return null;
  }

  if (getActiveTimetableCourses(state).length > 0) {
    if (state.userInfo.data.isLoggedIn && !state.savingTimetable.upToDate) {
      return dispatch(saveTimetable(false, () => dispatch(setSemester(semester))));
    } else if (state.userInfo.data.isLoggedIn) {
      dispatch(setSemester(semester));
    } else {
      dispatch({
        type: ActionTypes.ALERT_CHANGE_SEMESTER,
        semester,
      });
    }
  } else {
    dispatch(setSemester(semester));
  }
  return null;
};

export const fetchSearchResults = query => (dispatch, getState) => {
  if (query.length <= 1) {
    dispatch(receiveCourses([]));
    return;
  }

  // indicate that we are now requesting courses
  dispatch(requestCourses());
  // send a request (via fetch) to the appropriate endpoint to get courses
  fetch(getCourseSearchEndpoint(query, getSemester(getState())), {
    credentials: 'include',
  })
  .then(response => response.json()) // TODO error-check the response
  .then((json) => {
    // indicate that courses have been received
    dispatch(receiveCourses(json));
  });
};

export const fetchAdvancedSearchResults = (query, filters) => (dispatch, getState) => {
  // if too small a query AND no filters; don't make request.
  // we'll allow small query strings if some filters
  // (departments, or breadths, or levels) are chosen.
  if (query.length <= 1 && [].concat(...Object.values(filters)).length === 0) {
    dispatch({
      type: ActionTypes.RECEIVE_ADVANCED_SEARCH_RESULTS,
      response: { result: [] },
    });
    return;
  }

  // indicate that we are now requesting courses
  dispatch({
    type: ActionTypes.REQUEST_ADVANCED_SEARCH_RESULTS,
  });
  // send a request (via fetch) to the appropriate endpoint to get courses
  const state = getState();
  fetch(getCourseSearchEndpoint(query, getSemester(getState())), {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    method: 'POST',
    body: JSON.stringify({
      filters,
      semester: getCurrentSemester(state),
      page: state.explorationModal.page,
    }),
  })
  .then(response => response.json()) // TODO(rohan): error-check the response
  .then((json) => {
    // indicate that courses have been received
    dispatch({
      type: ActionTypes.RECEIVE_ADVANCED_SEARCH_RESULTS,
      response: normalize(json, [courseSchema]),
    });
  });
};

export const hoverSearchResult = position => ({
  type: ActionTypes.HOVER_SEARCH_RESULT,
  position,
});

export const paginateAdvancedSearchResults = () => (
  { type: ActionTypes.PAGINATE_ADVANCED_SEARCH_RESULTS }
);

export const clearAdvancedSearchPagination = () => (
  { type: ActionTypes.CLEAR_ADVANCED_SEARCH_PAGINATION }
);

export const setActiveAdvancedSearchResult = idx => (
  { type: ActionTypes.SET_ACTIVE_ADV_SEARCH_RESULT, active: idx }
);

export const setAdvancedSearchResultIndex = (idx, courseId) => (dispatch) => {
  dispatch(setActiveAdvancedSearchResult(idx));
  dispatch(fetchCourseClassmates(courseId));
};
