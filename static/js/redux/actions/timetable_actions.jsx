/*
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
*/

import fetch from 'isomorphic-fetch';
import Cookie from 'js-cookie';
import {
  getActiveTimetable,
  getActiveTimetableCourses,
  getCurrentSemester,
  getDenormTimetable } from '../reducers/root_reducer';
import { getTimetablesEndpoint } from '../constants/endpoints';
import {
    browserSupportsLocalStorage,
    generateCustomEventId,
    saveLocalActiveIndex,
    saveLocalCourseSections,
    saveLocalPreferences,
    saveLocalSemester,
} from '../util';
import { autoSave, fetchClassmates, lockActiveSections, getUserSavedTimetables } from './user_actions';
import { receiveCourses } from './search_actions';
import * as ActionTypes from '../constants/actionTypes';

let customEventUpdateTimer; // keep track of user's custom event actions for autofetch

export const alertConflict = () => ({ type: ActionTypes.ALERT_CONFLICT });

export const receiveTimetables = timetables => ({
  type: ActionTypes.RECEIVE_TIMETABLES,
  timetables,
});

export const changeActiveTimetable = newActive => ({
  type: ActionTypes.CHANGE_ACTIVE_TIMETABLE,
  newActive,
});

export const setActiveTimetable = newActive => (dispatch) => {
  dispatch(changeActiveTimetable(newActive));
  dispatch(autoSave());
};

export const requestTimetables = () => ({ type: ActionTypes.REQUEST_TIMETABLES });

export const fetchTimetables = (requestBody, removing, newActive = 0) => (dispatch, getState) => {
  const state = getState();

  // mark that we are now asynchronously requesting timetables
  dispatch(requestTimetables());

  // send a request (via fetch) to the appropriate endpoint with
  // relevant data as contained in @state (including courses, preferences, etc)
  fetch(getTimetablesEndpoint(), {
    headers: {
      'X-CSRFToken': Cookie.get('csrftoken'),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(requestBody),
    credentials: 'include',
  })
    .then((response) => {
      if (response.status === 200) {
        return response.json();
      } else if (browserSupportsLocalStorage()) {
        return localStorage.clear();
      }
      return null;
    })
    .then((json) => {
      if (removing || json.timetables.length > 0) {
        // receive new info into state
        dispatch(receiveCourses(json.courses));
        dispatch(receiveTimetables(json.timetables));
        dispatch({
          type: ActionTypes.RECEIVE_COURSE_SECTIONS,
          courseSections: json.new_c_to_s,
        });
        dispatch(changeActiveTimetable(newActive));

        // cache new info into local storage
        if (!state.userInfo.data.isLoggedIn) {
          saveLocalCourseSections(json.new_c_to_s);
          saveLocalActiveIndex(newActive);
          saveLocalPreferences(requestBody.preferences);
          saveLocalSemester(getCurrentSemester(state));
        }
      } else {
        // user wasn't removing or refetching for custom events
        // (i.e. was adding a course/section), but we got no timetables back.
        // therefore course added by the user resulted in a conflict
        dispatch({ type: ActionTypes.CLEAR_CONFLICTING_EVENTS });
        dispatch(alertConflict());
      }
      return json;
    })
    .then((json) => {
      const userData = state.userInfo.data;
      if (userData.isLoggedIn && json.timetables.length > 0 && userData.social_courses !== null) {
        dispatch(fetchClassmates(json.timetables[0]));
      }
    });
};

/*
 Returns the body of the request used to get new timetables
 */
export const getBaseReqBody = state => ({
  school: state.school.school,
  semester: getCurrentSemester(state),
  courseSections: state.courseSections.objects,
  preferences: state.preferences,
});

export const fetchStateTimetables = (activeIndex = 0) => (dispatch, getState) => {
  const requestBody = getBaseReqBody(getState());
  dispatch(fetchTimetables(requestBody, false, activeIndex));
};

// load a single timetable into the calendar and lock all of its sections (used for personal and
// shared timetables)
// accepts a normalized timetable as input
export const lockTimetable = timetable => (dispatch, getState) => {
  const state = getState();

  if (timetable.has_conflict) {
    dispatch({ type: ActionTypes.TURN_CONFLICTS_ON });
  }
  dispatch({
    type: ActionTypes.RECEIVE_COURSE_SECTIONS,
    courseSections: lockActiveSections(getDenormTimetable(state, timetable)),
  });
  dispatch(receiveTimetables([timetable]));
  if (state.userInfo.data.isLoggedIn) {
    dispatch(fetchClassmates(timetable));
  }
};

// load a personal timetable into state
export const loadTimetable = (
  timetable, isLoadingNewTimetable = false,
  autoLockAll = true,
) => (dispatch, getState) => {
  const state = getState();
  const isLoggedIn = state.userInfo.data.isLoggedIn;
  if (!isLoggedIn) {
    return dispatch({ type: ActionTypes.TOGGLE_SIGNUP_MODAL });
  }

  const displayTimetable = {
    ...timetable,
    events: timetable.events.map(event =>
      ({ ...event, id: generateCustomEventId(), preview: false })),
  };
  if (autoLockAll) {
    dispatch({
      type: ActionTypes.CHANGE_ACTIVE_SAVED_TIMETABLE,
      timetable: displayTimetable,
      upToDate: !isLoadingNewTimetable,
    });

    return dispatch(lockTimetable(displayTimetable));
  }
  return dispatch({
    type: ActionTypes.CHANGE_ACTIVE_SAVED_TIMETABLE,
    timetable: displayTimetable,
    upToDate: !isLoadingNewTimetable,
  });
};

export const createNewTimetable = (ttName = 'Untitled Schedule') => (dispatch) => {
  dispatch(loadTimetable({ name: ttName, slots: [], events: [], has_conflict: false }, true));
};

export const nullifyTimetable = () => (dispatch) => {
  dispatch(receiveTimetables([{ slots: [], has_conflict: false }]));
  dispatch({
    type: ActionTypes.RECEIVE_COURSE_SECTIONS,
    courseSections: {},
  });
  dispatch({
    type: ActionTypes.CHANGE_ACTIVE_SAVED_TIMETABLE,
    timetable: { name: 'Untitled Schedule', slots: [], events: [], has_conflict: false },
    upToDate: false,
  });
  dispatch({
    type: ActionTypes.CLEAR_OPTIONAL_COURSES,
  });
  dispatch({
    type: ActionTypes.CLEAR_CUSTOM_SLOTS,
  });
};

// get semester index of cached index into allSemesters
const getSemesterIndex = function getSemesterIndex(allSemesters, oldSemesters) {
  let cachedSemesterIndex = localStorage.getItem('semester');
  if (cachedSemesterIndex !== null) { // last timetable was cached using old format
    if (cachedSemesterIndex === 'S') { // last timetable was cached using old old format
      cachedSemesterIndex = allSemesters.findIndex(s =>
       (s.name === 'Spring' || s.name === 'Winter')
       && s.year === '2017');
    } else if (cachedSemesterIndex === 'F') {
      cachedSemesterIndex = allSemesters.findIndex(s => s.name === 'Fall' && s.year === '2016');
    }
    const semester = oldSemesters[Number(cachedSemesterIndex)];
    return allSemesters.findIndex(s =>
      s.name === semester.name && s.year === semester.year);
  }
  const cachedSemesterName = localStorage.getItem('semesterName');
  const cachedYear = localStorage.getItem('year');
  return allSemesters.findIndex(sem =>
    sem.name === cachedSemesterName && sem.year === cachedYear);
};

// loads timetable from localStorage. assumes that the browser supports localStorage
export const loadCachedTimetable = (allSemesters, oldSemesters) => (dispatch, getState) => {
  dispatch({ type: ActionTypes.LOADING_CACHED_TT });
  // load timetable information from local storage
  const localCourseSections = JSON.parse(localStorage.getItem('courseSections'));
  const localPreferences = JSON.parse(localStorage.getItem('preferences'));
  const localActive = parseInt(localStorage.getItem('active'), 10);
  const matchedIndex = getSemesterIndex(allSemesters, oldSemesters);

  // validate local storage info
  const cachedSemesterNotFound = matchedIndex === -1;
  const cachedCourseSectionsExist = localCourseSections &&
    Object.keys(localCourseSections).length > 0;
  const cachedPreferencesExist = localPreferences && Object.keys(localPreferences).length > 0;
  const isCachedTimetableDataValid = cachedCourseSectionsExist && cachedPreferencesExist &&
    !cachedSemesterNotFound;

  if (!isCachedTimetableDataValid) { // switch back to default semester
    dispatch(nullifyTimetable(dispatch));
  } else {
    let personalTimetablesExist = false;
    if (getState().userInfo.data.isLoggedIn) {
      dispatch(getUserSavedTimetables(allSemesters[matchedIndex]));
      personalTimetablesExist = Object.keys(getState().courseSections.objects).length > 0;
    }
    if (!personalTimetablesExist) {
      // if no personal TTs and local storage data is valid, load cached timetable
      dispatch({ type: ActionTypes.SET_ALL_PREFERENCES, preferences: localPreferences });
      dispatch({ type: ActionTypes.SET_SEMESTER, semester: matchedIndex });
      dispatch({
        type: ActionTypes.RECEIVE_COURSE_SECTIONS,
        courseSections: localCourseSections,
      });
      dispatch(fetchStateTimetables(localActive));
    }
  }
  dispatch({ type: ActionTypes.CACHED_TT_LOADED });
};

/*
 * Numbers the provided string based on the number of other timetables with
 * that name. e.g. getNumberedName("Untitled") -> "Untitled 2" if there are 2
 * other timetables with "Untitled" in the title, or "Untitled" if there
 * no others.
 */
export const getNumberedName = (name, timetables) => {
  const tokens = name.split(' ');
  const nameBase = !isNaN(tokens[tokens.length - 1]) ?
    tokens.slice(0, tokens.length - 1).join(' ') : name;
  let numberSuffix = timetables.filter(
    t => t.name.indexOf(nameBase) > -1).length;
  numberSuffix = numberSuffix === 0 ? '' : ` ${numberSuffix}`;
  return nameBase + numberSuffix;
};

export const handleCreateNewTimetable = () => (dispatch, getState) => {
  const state = getState();
  const isLoggedIn = state.userInfo.data.isLoggedIn;
  if (!isLoggedIn) {
    return dispatch({ type: ActionTypes.TOGGLE_SIGNUP_MODAL });
  }

  if (getActiveTimetable(state).slots.length > 0 && !state.savingTimetable.upToDate) {
    return dispatch({ type: ActionTypes.ALERT_NEW_TIMETABLE });
  }

  return dispatch(createNewTimetable(getNumberedName('Untitled Schedule',
    state.userInfo.data.timetables)));
};

export const unHoverSection = () => ({ type: ActionTypes.UNHOVER_SECTION });

export const hoverSection = (denormCourse, section) => ({
  type: ActionTypes.HOVER_SECTION,
  slot: {
    course: denormCourse,
    section,
    offerings: section.offering_set,
    is_optional: false,
    is_locked: true,
  },
});

/*
 Attempts to add the course represented by newCourseId
 to the user's roster. If a section is provided, that section is
 locked. Otherwise, no section is locked.
 */
export const addOrRemoveCourse = (newCourseId, lockingSection = '') => (dispatch, getState) => {
  let state = getState();
  if (state.timetables.isFetching) {
    return;
  }

  const removing = state.courseSections.objects[newCourseId] !== undefined && lockingSection === '';
  let reqBody = getBaseReqBody(state);
  if (state.optionalCourses.courses.some(c => c === newCourseId)) {
    dispatch({
      type: ActionTypes.REMOVE_OPTIONAL_COURSE_BY_ID,
      courseId: newCourseId,
    });
    reqBody = getBaseReqBody(state);
  }

  state = getState();
  if (removing) {
    const updatedCourseSections = Object.assign({}, state.courseSections.objects);
    delete updatedCourseSections[newCourseId]; // remove it from courseSections.objects
    reqBody.courseSections = updatedCourseSections;
    Object.assign(reqBody, {
      optionCourses: state.optionalCourses.courses,
      numOptionCourses: state.optionalCourses.numRequired,
      customSlots: state.customSlots,
    });
  } else { // adding a course
    dispatch({
      type: ActionTypes.UPDATE_LAST_COURSE_ADDED,
      course: newCourseId,
    });
    state = getState();
    Object.assign(reqBody, {
      updated_courses: [{
        course_id: newCourseId,
        section_codes: [lockingSection],
      }],
      optionCourses: state.optionalCourses.courses,
      numOptionCourses: state.optionalCourses.numRequired,
      customSlots: state.customSlots,
    });
  }

  // user must be removing this course if it's already in roster,
  // and they're not trying to lock a new section).
  // otherwise, they're adding it
  dispatch(fetchTimetables(reqBody, removing));
  dispatch(autoSave());
};

// fetch timetables with same courses, but updated optional courses/custom slots
const refetchTimetables = () => (dispatch, getState) => {
  const state = getState();
  const reqBody = getBaseReqBody(state);

  Object.assign(reqBody, {
    optionCourses: state.optionalCourses.courses,
    numOptionCourses: state.optionalCourses.numRequired,
    customSlots: state.customSlots,
  });

  dispatch(fetchTimetables(reqBody, false));
  dispatch(autoSave());
};

export const addLastAddedCourse = () => (dispatch, getState) => {
  const state = getState();
  // last timetable change was a custom event edit, not add
  if (state.timetables.lastSlotAdded === null) {
    return;
  }
  if (typeof state.timetables.lastSlotAdded === 'object') {
    dispatch({
      type: ActionTypes.RECEIVE_CUSTOM_SLOTS,
      events: state.timetables.lastSlotAdded,
    });
    dispatch(refetchTimetables());
  } else if (typeof state.timetables.lastSlotAdded === 'number') {
    dispatch(addOrRemoveCourse(state.timetables.lastSlotAdded));
  }
};

const autoFetch = () => (dispatch, getState) => {
  const state = getState();
  clearTimeout(customEventUpdateTimer);
  customEventUpdateTimer = setTimeout(() => {
    if (getActiveTimetableCourses(state).length > 0) {
      dispatch({
        type: ActionTypes.UPDATE_LAST_COURSE_ADDED,
        course: state.customSlots,
      });
      dispatch(refetchTimetables());
    }
  }, 250);
};

export const addCustomSlot = (timeStart, timeEnd, day, preview, id) => (dispatch) => {
  dispatch({
    type: ActionTypes.ADD_CUSTOM_SLOT,
    newCustomSlot: {
      time_start: timeStart, // match backend slot attribute names
      time_end: timeEnd,
      name: 'New Custom Event', // default name for custom slot
      day,
      id,
      preview,
    },
  });
  dispatch(autoFetch());
};

export const removeCustomSlot = id => (dispatch) => {
  dispatch({
    type: ActionTypes.REMOVE_CUSTOM_SLOT,
    id,
  });
  dispatch(autoFetch());
};

export const updateCustomSlot = (newValues, id) => (dispatch) => {
  if (newValues.time_start !== undefined && newValues.time_start === newValues.time_end) {
    dispatch(removeCustomSlot(id));
    // For some reason, students can drag and drop past midnight
  } else if (newValues.time_end !== undefined && newValues.time_end <= '24:00') {
    dispatch({
      type: ActionTypes.UPDATE_CUSTOM_SLOT,
      newValues,
      id,
    });
  }
  const changedProps = Object.keys(newValues);
  const onlyChangingName = changedProps.length === 1 && changedProps[0] === 'name';
  if (onlyChangingName) {
    dispatch(autoSave());
  } else { // only refetch if we are changing the slot time
    dispatch(autoFetch());
  }
};

export const addOrRemoveOptionalCourse = course => (dispatch, getState) => {
  const removing = getState().optionalCourses.courses.some(c => c === course.id);
  if (getState().timetables.isFetching) {
    return;
  }

  dispatch({
    type: ActionTypes.ADD_REMOVE_OPTIONAL_COURSE,
    newCourseId: course.id,
  });
  const state = getState(); // the above dispatched action changes the state
  const reqBody = getBaseReqBody(state);
  const { optionalCourses } = state;

  const optionCourses = optionalCourses.courses;

  Object.assign(reqBody, {
    optionCourses,
    numOptionCourses: state.optionalCourses.numRequired,
  });
  dispatch(fetchTimetables(reqBody, removing));
};

export const toggleConflicts = () => ({ type: ActionTypes.TOGGLE_CONFLICTS });

export const addMetric = metric => ({ type: ActionTypes.ADD_METRIC, metric });

export const removeMetric = metric => ({ type: ActionTypes.REMOVE_METRIC, metric });

export const changeMetric = (add, del) => ({ type: ActionTypes.SWITCH_METRIC, add, del });

export const toggleMetricOrder = metric => ({ type: ActionTypes.TOGGLE_METRIC_ORDER, metric });
