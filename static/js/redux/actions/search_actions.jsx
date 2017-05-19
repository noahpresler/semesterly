import fetch from 'isomorphic-fetch';
import {
  getCourseSearchEndpoint,
  getAdvancedCourseSearchEndpoint } from '../constants/endpoints';
import { store } from '../init';
import { getUserSavedTimetables, saveTimetable } from './user_actions';
import { nullifyTimetable } from './timetable_actions';
import * as ActionTypes from '../constants/actionTypes';
import { fetchCourseClassmates } from './modal_actions';
import { currSem } from '../reducers/semester_reducer';

export const requestCourses = () => ({ type: ActionTypes.REQUEST_COURSES });

export const receiveCourses = json => ({
  type: ActionTypes.RECEIVE_COURSES,
  courses: json,
});

export const setSemester = semester => (dispatch) => {
  const state = store.getState();

  if (state.userInfo.data.isLoggedIn) {
    dispatch(getUserSavedTimetables(state.semester.all[semester]));
  } else {
    dispatch(nullifyTimetable(dispatch));
  }

  dispatch({
    type: ActionTypes.SET_SEMESTER,
    semester,
  });
  dispatch({
    type: ActionTypes.RECEIVE_COURSES,
    courses: [],
  });
};

/*
 * Check whether the user is logged in and whether their timetable is up to date
 * and set semester if appropriate. Otherwise show an alert modal and save the
 * semester they were trying to switch to in the modal state.
 */
export const maybeSetSemester = semester => (dispatch) => {
  const state = store.getState();

  if (semester === state.semester.current) {
    return;
  }

  if (state.timetables.items[state.timetables.active].courses.length > 0) {
    if (state.userInfo.data.isLoggedIn && !state.savingTimetable.upToDate) {
      dispatch(saveTimetable(false, () => setSemester(semester)));
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
};

export const fetchSearchResults = query => (dispatch) => {
  if (query.length <= 1) {
    dispatch(receiveCourses([]));
    return;
  }

  // indicate that we are now requesting courses
  dispatch(requestCourses());
  // send a request (via fetch) to the appropriate endpoint to get courses
  fetch(getCourseSearchEndpoint(query), {
    credentials: 'include',
  })
  .then(response => response.json()) // TODO(rohan): error-check the response
  .then((json) => {
    // indicate that courses have been received
    dispatch(receiveCourses(json));
  });
};

export const fetchAdvancedSearchResults = (query, filters) => (dispatch) => {
  // if too small a query AND no filters; don't make request.
  // we'll allow small query strings if some filters
  // (departments, or breadths, or levels) are chosen.
  if (query.length <= 1 && [].concat(...Object.values(filters)).length === 0) {
    dispatch({
      type: ActionTypes.RECEIVE_ADVANCED_SEARCH_RESULTS,
      advancedSearchResults: [],
    });
    return;
  }

  // indicate that we are now requesting courses
  dispatch({
    type: ActionTypes.REQUEST_ADVANCED_SEARCH_RESULTS,
  });
  // send a request (via fetch) to the appropriate endpoint to get courses
  const state = store.getState();
  fetch(getAdvancedCourseSearchEndpoint(query, state.explorationModal.page), {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    method: 'POST',
    body: JSON.stringify({
      filters,
      semester: currSem(state.semester),
      page: state.explorationModal.page,
    }),
  })
  .then(response => response.json()) // TODO(rohan): error-check the response
  .then((json) => {
    // indicate that courses have been received
    dispatch({
      type: ActionTypes.RECEIVE_ADVANCED_SEARCH_RESULTS,
      advancedSearchResults: json,
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
