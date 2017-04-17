import fetch from 'isomorphic-fetch';
import { getAdvancedSearchEndpoint, getCourseSearchEndpoint } from '../constants/endpoints';
import { store } from '../init';
import { getUserSavedTimetables, saveTimetable } from './user_actions';
import { nullifyTimetable } from './timetable_actions';
import * as ActionTypes from '../constants/actionTypes';
import { fetchCourseClassmates } from './modal_actions';

export function requestCourses() {
  return {
    type: ActionTypes.REQUEST_COURSES,
  };
}

export function receiveCourses(json) {
  return {
    type: ActionTypes.RECEIVE_COURSES,
    courses: json.results,
  };
}

export const setSemester = semester => (dispatch) => {
  const state = store.getState();

  if (state.userInfo.data.isLoggedIn) {
    dispatch(getUserSavedTimetables(allSemesters[semester]));
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
}

/*
 * Check whether the user is logged in and whether their timetable is up to date
 * and set semester if appropriate. Otherwise show an alert modal and save the
 * semester they were trying to switch to in the modal state.
 */
export const maybeSetSemester = semester => (dispatch) => {
  const state = store.getState();

  if (semester === state.semesterIndex) {
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
}

export function fetchSearchResults(query) {
  return (dispatch) => {
    if (query.length <= 1) {
      dispatch(receiveCourses({ results: [] }));
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
}

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
  fetch(getAdvancedSearchEndpoint(), {
    credentials: 'include',
    method: 'POST',
    body: JSON.stringify({
      query,
      filters,
      semester: allSemesters[state.semesterIndex],
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

export function paginateAdvancedSearchResults() {
  return { type: ActionTypes.PAGINATE_ADVANCED_SEARCH_RESULTS };
}

export function clearAdvancedSearchPagination() {
  return { type: ActionTypes.CLEAR_ADVANCED_SEARCH_PAGINATION };
}

export function setActiveAdvancedSearchResult(idx) {
  return { type: ActionTypes.SET_ACTIVE_ADV_SEARCH_RESULT, active: idx };
}

export const setAdvancedSearchResultIndex = (idx, courseId) => (dispatch) => {
  dispatch(setActiveAdvancedSearchResult(idx));
  dispatch(fetchCourseClassmates(courseId));
};
