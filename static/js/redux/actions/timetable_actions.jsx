import fetch from 'isomorphic-fetch';
import Cookie from 'js-cookie';

import { getTimetablesEndpoint } from '../constants/endpoints';
import {
    browserSupportsLocalStorage,
    randomString,
    saveLocalActiveIndex,
    saveLocalCourseSections,
    saveLocalPreferences,
    saveLocalSemester,
} from '../util';
import { store } from '../init';
import { autoSave, fetchClassmates, lockActiveSections } from './user_actions';
import * as ActionTypes from '../constants/actionTypes';

export const SID = randomString(30);

export const alertConflict = () => ({ type: ActionTypes.ALERT_CONFLICT });

export const triggerTosModal = () => ({ type: ActionTypes.TRIGGER_TOS_MODAL });

export const triggerTosBanner = () => ({ type: ActionTypes.TRIGGER_TOS_BANNER });

export const receiveTimetables = timetables => ({
  type: ActionTypes.RECEIVE_TIMETABLES,
  timetables,
});

export const requestTimetables = () => ({ type: ActionTypes.REQUEST_TIMETABLES });

export const fetchTimetables = (requestBody, removing, newActive = 0) => (dispatch) => {
  const state = store.getState();

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
    }) // TODO(Rohan): maybe log somewhere if errors?
    .then((json) => {
      if (removing || json.timetables.length > 0) {
        // mark that timetables and a new courseSections have been received
        dispatch(receiveTimetables(json.timetables));
        dispatch({
          type: ActionTypes.RECEIVE_COURSE_SECTIONS,
          courseSections: json.new_c_to_s,
        });
        if (newActive > 0) {
          dispatch({
            type: ActionTypes.CHANGE_ACTIVE_TIMETABLE,
            newActive,
          });
        }
        // save new courseSections and timetable active index to cache
        saveLocalCourseSections(json.new_c_to_s);
        saveLocalActiveIndex(newActive);
      } else {
        // user wasn't removing (i.e. was adding a course/section), but we got no timetables back
        // course added by the user resulted in a conflict, so no timetables
        // were received
        dispatch(alertConflict());
      }
      return json;
    })
    .then((json) => {
      if (state.userInfo.data.isLoggedIn && json.timetables[0]) {
        if (state.userInfo.data.social_courses !== null) {
          dispatch(fetchClassmates(json.timetables[0].courses.map(c => c.id)));
        }
      }
    });

  // save preferences when timetables are loaded, so that we know cached preferences
  // are always "up-to-date" (correspond to last loaded timetable).
  // same for the semester
  saveLocalPreferences(requestBody.preferences);
  if (localStorage.semester !== state.semesterIndex) {
    saveLocalSemester(state.semesterIndex);
  }
};

/*
 Returns the body of the request used to get new timetables
 */
export const getBaseReqBody = state => ({
  school: state.school.school,
  semester: allSemesters[state.semesterIndex],
  courseSections: state.courseSections.objects,
  preferences: state.preferences,
  sid: SID,
});

export const hoverSection = (course, section) => {
  const courseToHover = course;
  const availableSections = Object.assign({},
    courseToHover.sections.L,
    courseToHover.sections.T,
    courseToHover.sections.P,
  );
  courseToHover.section = section;
  return {
    type: ActionTypes.HOVER_COURSE,
    course: Object.assign({}, courseToHover, { slots: availableSections[section] }),
  };
};

export const fetchStateTimetables = (activeIndex = 0) => (dispatch) => {
  const requestBody = getBaseReqBody(store.getState());
  dispatch(fetchTimetables(requestBody, false, activeIndex));
};

export const lockTimetable = (timetable, created, isLoggedIn) => (dispatch) => {
  if (timetable.has_conflict) { // turn conflicts on if necessary
    dispatch({ type: ActionTypes.TURN_CONFLICTS_ON });
  }
  dispatch({
    type: ActionTypes.RECEIVE_COURSE_SECTIONS,
    courseSections: lockActiveSections(timetable),
  });
  dispatch({
    type: ActionTypes.RECEIVE_TIMETABLES,
    timetables: [timetable],
    preset: created === false,
  });
  if (isLoggedIn) { // fetch classmates for this timetable only if the user is logged in
    dispatch(fetchClassmates(timetable.courses.map(c => c.id)));
  }
};


// loads @timetable into the state.
// @created is true if the user is creating a new timetable
export const loadTimetable = (timetable, created = false) => (dispatch) => {
  const state = store.getState();
  const isLoggedIn = state.userInfo.data.isLoggedIn;
  if (!isLoggedIn) {
    return dispatch({ type: ActionTypes.TOGGLE_SIGNUP_MODAL });
  }

  // store the 'saved timetable' (handled by the saving_timetable reducer)
  dispatch({
    type: ActionTypes.CHANGE_ACTIVE_SAVED_TIMETABLE,
    timetable,
    created,
  });

  // lock sections for this timetable; and mark it as the only available one
  return dispatch(lockTimetable(timetable, created, isLoggedIn));
};

export const createNewTimetable = (ttName = 'Untitled Schedule') => (dispatch) => {
  dispatch(loadTimetable({ name: ttName, courses: [], has_conflict: false }, true));
};

export const nullifyTimetable = () => (dispatch) => {
  dispatch({
    type: ActionTypes.RECEIVE_TIMETABLES,
    timetables: [{ courses: [], has_conflict: false }],
  });
  dispatch({
    type: ActionTypes.RECEIVE_COURSE_SECTIONS,
    courseSections: {},
  });
  dispatch({
    type: ActionTypes.CHANGE_ACTIVE_SAVED_TIMETABLE,
    timetable: { name: 'Untitled Schedule', courses: [], has_conflict: false },
  });
  dispatch({
    type: ActionTypes.CLEAR_OPTIONAL_COURSES,
  });
};

// loads timetable from localStorage. assumes that the browser supports localStorage
export const loadCachedTimetable = () => (dispatch) => {
  dispatch({ type: ActionTypes.LOADING_CACHED_TT });
  const localCourseSections = JSON.parse(localStorage.getItem('courseSections'));

  // no course sections stored locally; user is new (or hasn't added timetables yet)
  if (!localCourseSections) {
    dispatch({ type: ActionTypes.CACHED_TT_LOADED });
    return;
  }

  // no preferences stored locally; save the defaults
  const localPreferences = JSON.parse(localStorage.getItem('preferences'));
  let localSemester = localStorage.getItem('semester');
  if (localSemester === 'S') {
    localSemester = allSemesters.findIndex(s =>
      (s.name === 'Spring' || s.name === 'Winter')
      && s.year === '2017');
  } else if (localSemester === 'F') {
    localSemester = allSemesters.findIndex(s => s.name === 'Fall' && s.year === '2016');
  }

  const localActive = parseInt(localStorage.getItem('active'), 10);
  if (Object.keys(localCourseSections).length === 0 || Object.keys(localPreferences).length === 0) {
    return;
  }

  dispatch({ type: ActionTypes.SET_ALL_PREFERENCES, preferences: localPreferences });
  dispatch({ type: ActionTypes.SET_SEMESTER, semester: parseInt(localSemester, 10) });
  dispatch({
    type: ActionTypes.RECEIVE_COURSE_SECTIONS,
    courseSections: localCourseSections,
  });

  dispatch(fetchStateTimetables(localActive));
  dispatch({ type: ActionTypes.CACHED_TT_LOADED });
};

/*
 * Numbers the provided string based on the number of other timetables with
 * that name. e.g. getNumberedName("Untitled") -> "Untitled 2" if there are 2
 * other timetables with "Untitled" in the title, or "Untitled" if there
 * no others.
 */
export const getNumberedName = (name) => {
  const state = store.getState();
  const tokens = name.split(' ');
  const nameBase = !isNaN(tokens[tokens.length - 1]) ?
    tokens.slice(0, tokens.length - 1).join(' ') : name;
  let numberSuffix = state.userInfo.data.timetables.filter(
    t => t.name.indexOf(nameBase) > -1).length;
  numberSuffix = numberSuffix === 0 ? '' : ` ${numberSuffix}`;
  return nameBase + numberSuffix;
};

export const handleCreateNewTimetable = () => (dispatch) => {
  const state = store.getState();
  const isLoggedIn = state.userInfo.data.isLoggedIn;
  if (!isLoggedIn) {
    return { type: ActionTypes.TOGGLE_SIGNUP_MODAL };
  }

  const { timetables: timetablesState } = state;

  if (timetablesState.items[timetablesState.active].courses.length > 0
    && !state.savingTimetable.upToDate) {
    return { type: ActionTypes.ALERT_NEW_TIMETABLE };
  }

  return dispatch(createNewTimetable(getNumberedName('Untitled Schedule')));
};

export const unHoverSection = () => ({ type: ActionTypes.UNHOVER_COURSE });

/*
 Attempts to add the course represented by newCourseId
 to the user's roster. If a section is provided, that section is
 locked. Otherwise, no section is locked.
 */
export const addOrRemoveCourse = (newCourseId, lockingSection = '') => (dispatch) => {
  let state = store.getState();
  if (state.timetables.isFetching) {
    return;
  }

  const removing = state.courseSections.objects[newCourseId] !== undefined && lockingSection === '';
  let reqBody = getBaseReqBody(state);
  if (state.optionalCourses.courses.some(c => c.id === newCourseId)) {
    dispatch({
      type: ActionTypes.REMOVE_OPTIONAL_COURSE_BY_ID,
      courseId: newCourseId,
    });
    reqBody = getBaseReqBody(store.getState());
  }

  state = store.getState();
  if (removing) {
    const updatedCourseSections = Object.assign({}, state.courseSections.objects);
    delete updatedCourseSections[newCourseId]; // remove it from courseSections.objects
    reqBody.courseSections = updatedCourseSections;
    Object.assign(reqBody, {
      optionCourses: state.optionalCourses.courses.map(c => c.id),
      numOptionCourses: state.optionalCourses.numRequired,
      customSlots: state.customSlots,
    });
  } else { // adding a course
    dispatch({
      type: ActionTypes.UPDATE_LAST_COURSE_ADDED,
      course: newCourseId,
    });
    state = store.getState();
    Object.assign(reqBody, {
      updated_courses: [{
        course_id: newCourseId,
        section_codes: [lockingSection],
      }],
      optionCourses: state.optionalCourses.courses.map(c => c.id),
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

export const addLastAddedCourse = () => (dispatch) => {
  const state = store.getState();
  if (state.timetables.lastCourseAdded !== null) {
    dispatch(addOrRemoveCourse(state.timetables.lastCourseAdded));
  }
};

export const addCustomSlot = (timeStart, timeEnd, day, preview, id) => ({
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

export const updateCustomSlot = (newValues, id) => ({
  type: ActionTypes.UPDATE_CUSTOM_SLOT,
  newValues,
  id,
});

export const removeCustomSlot = id => (dispatch) => {
  dispatch({
    type: ActionTypes.REMOVE_CUSTOM_SLOT,
    id,
  });
};

export const addOrRemoveOptionalCourse = course => (dispatch) => {
  const removing = store.getState().optionalCourses.courses.some(c => c.id === course.id);
  if (store.getState().timetables.isFetching) {
    return;
  }

  dispatch({
    type: ActionTypes.ADD_REMOVE_OPTIONAL_COURSE,
    newCourse: course,
  });
  const state = store.getState(); // the above dispatched action changes the state
  const reqBody = getBaseReqBody(state);
  const { optionalCourses } = state;

  const optionCourses = optionalCourses.courses.map(c => c.id);

  Object.assign(reqBody, {
    optionCourses,
    numOptionCourses: state.optionalCourses.numRequired,
  });
  dispatch(fetchTimetables(reqBody, removing));
};

export const changeActiveTimetable = newActive => ({
  type: ActionTypes.CHANGE_ACTIVE_TIMETABLE,
  newActive,
});

export const setActiveTimetable = newActive => (dispatch) => {
  dispatch(changeActiveTimetable(newActive));
  dispatch(autoSave());
};

export const toggleConflicts = () => ({ type: ActionTypes.TOGGLE_CONFLICTS });

export const addMetric = metric => ({ type: ActionTypes.ADD_METRIC, metric });

export const removeMetric = metric => ({ type: ActionTypes.REMOVE_METRIC, metric });

export const changeMetric = (add, del) => ({ type: ActionTypes.SWITCH_METRIC, add, del });

export const toggleMetricOrder = metric => ({ type: ActionTypes.TOGGLE_METRIC_ORDER, metric });
