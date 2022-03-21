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

import fetch from "isomorphic-fetch";
import Cookie from "js-cookie";
import { getActiveTimetable, getCurrentSemester, getDenormTimetable } from "../state";
import {
  getTimetablesEndpoint,
  getPersonalEventEndpoint,
} from "../constants/endpoints";
import {
  browserSupportsLocalStorage,
  saveLocalActiveIndex,
  saveLocalCourseSections,
  saveLocalPreferences,
  saveLocalSemester,
} from "../util";
import {
  autoSave,
  fetchClassmates,
  lockActiveSections,
  getUserSavedTimetables,
} from "./user_actions";
import { alertsActions } from "../state/slices";
import {
  changeActiveTimetable,
  receiveTimetables,
  alertConflict,
  receiveCourses,
  updateExistingEvent,
  removeCustomEvent,
  changeActiveSavedTimetable,
} from "./initActions";
import { timetablesActions } from "../state/slices/timetablesSlice";
import { semesterActions } from "../state/slices/semesterSlice";
import { customEventsActions } from "../state/slices/customEventsSlice";
import { courseSectionsActions } from "../state/slices/courseSectionsSlice";
import { signupModalActions } from "../state/slices/signupModalSlice";
import { convertToMinutes } from "../ui/slotUtils";
import { preferencesActions } from "../state/slices/preferencesSlice";
import {
  addRemoveOptionalCourse,
  clearOptionalCourses,
  removeOptionalCourseById,
} from "../state/slices/optionalCoursesSlice";
import { savingTimetableActions } from "../state/slices/savingTimetableSlice";

export const setActiveTimetable = (newActive) => (dispatch) => {
  dispatch(changeActiveTimetable(newActive));
  dispatch(autoSave());
};

export const fetchTimetables =
  (requestBody, removing, newActive = 0) =>
  (dispatch, getState) => {
    const state = getState();

    // mark that we are now asynchronously requesting timetables
    dispatch(timetablesActions.setIsFetching(true));

    // send a request (via fetch) to the appropriate endpoint with
    // relevant data as contained in @state (including courses, preferences, etc)
    fetch(getTimetablesEndpoint(), {
      headers: {
        "X-CSRFToken": Cookie.get("csrftoken"),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(requestBody),
      credentials: "include",
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
          dispatch(courseSectionsActions.receiveCourseSections(json.new_c_to_s));
          dispatch(changeActiveTimetable(newActive));
          // cache new info into local storage
          if (!state.userInfo.data.isLoggedIn) {
            saveLocalCourseSections(json.new_c_to_s);
            saveLocalActiveIndex(newActive);
            saveLocalPreferences(requestBody.preferences);
            saveLocalSemester(getCurrentSemester(state));
          }
        } else if (json.courses.length !== 0) {
          // moving event when no courses okay
          // user wasn't removing or refetching for custom events
          // (i.e. was adding a course/section), but we got no timetables back.
          // therefore course added by the user resulted in a conflict
          dispatch(alertConflict());
        } else {
          // hide loader regardless of api response
          dispatch(timetablesActions.setIsFetching(false));
        }
        return json;
      })
      .then((json) => {
        const userData = state.userInfo.data;
        if (
          userData.isLoggedIn &&
          json.timetables.length > 0 &&
          userData.social_courses !== null
        ) {
          dispatch(fetchClassmates(json.timetables[0]));
        }
        // dispatch only after this promise resolves
        dispatch(autoSave());
      });
  };

/*
 Returns the body of the request used to get new timetables
 */
export const getBaseReqBody = (state) => ({
  school: state.school.school,
  semester: getCurrentSemester(state),
  courseSections: state.courseSections.objects,
  preferences: state.preferences,
});

export const fetchStateTimetables =
  (activeIndex = 0) =>
  (dispatch, getState) => {
    const requestBody = getBaseReqBody(getState());
    dispatch(fetchTimetables(requestBody, false, activeIndex));
  };

// load a single timetable into the calendar and lock all of its sections (used for personal and
// shared timetables)
// accepts a normalized timetable as input
export const lockTimetable = (timetable) => (dispatch, getState) => {
  const state = getState();

  if (timetable.has_conflict) {
    dispatch(preferencesActions.turnConflictsOn());
  }
  dispatch(
    courseSectionsActions.receiveCourseSections(
      lockActiveSections(getDenormTimetable(state, timetable))
    )
  );
  dispatch(receiveTimetables([timetable]));
  if (state.userInfo.data.isLoggedIn) {
    dispatch(fetchClassmates(timetable));
  }
};

// load a personal timetable into state
export const loadTimetable =
  (timetable, isLoadingNewTimetable = false, autoLockAll = true) =>
  (dispatch, getState) => {
    const state = getState();
    const isLoggedIn = state.userInfo.data.isLoggedIn;
    if (!isLoggedIn) {
      return dispatch(signupModalActions.showSignupModal());
    }

    const displayTimetable = {
      ...timetable,
      events: timetable.events.map((event) => ({
        ...event,
        preview: false,
      })),
    };
    if (autoLockAll) {
      dispatch(
        changeActiveSavedTimetable({
          timetable: displayTimetable,
          upToDate: !isLoadingNewTimetable,
        })
      );
      return dispatch(lockTimetable(displayTimetable));
    }
    return dispatch(
      changeActiveSavedTimetable({
        timetable: displayTimetable,
        upToDate: !isLoadingNewTimetable,
      })
    );
  };

export const createNewTimetable =
  (ttName = "Untitled Schedule") =>
  (dispatch) => {
    dispatch(
      loadTimetable(
        {
          name: ttName,
          slots: [],
          events: [],
          has_conflict: false,
          show_weekend: true,
        },
        true
      )
    );
  };

export const nullifyTimetable = () => (dispatch) => {
  dispatch(receiveTimetables([{ slots: [] }]));
  dispatch(courseSectionsActions.receiveCourseSections({}));
  dispatch(
    changeActiveSavedTimetable({
      timetable: {
        name: "Untitled Schedule",
        slots: [],
        events: [],
        has_conflict: false,
        show_weekend: true,
      },
      upToDate: false,
    })
  );
  dispatch(clearOptionalCourses());
  dispatch(customEventsActions.clearCustomEvents());
};

// get semester index of cached index into allSemesters
const getSemesterIndex = function getSemesterIndex(allSemesters, oldSemesters) {
  let cachedSemesterIndex = localStorage.getItem("semester");
  if (cachedSemesterIndex !== null) {
    // last timetable was cached using old format
    if (cachedSemesterIndex === "S") {
      // last timetable was cached using old old format
      cachedSemesterIndex = allSemesters.findIndex(
        (s) => (s.name === "Spring" || s.name === "Winter") && s.year === "2017"
      );
    } else if (cachedSemesterIndex === "F") {
      cachedSemesterIndex = allSemesters.findIndex(
        (s) => s.name === "Fall" && s.year === "2016"
      );
    }
    const semester = oldSemesters[Number(cachedSemesterIndex)];
    return allSemesters.findIndex(
      (s) => s.name === semester.name && s.year === semester.year
    );
  }
  const cachedSemesterName = localStorage.getItem("semesterName");
  const cachedYear = localStorage.getItem("year");
  return allSemesters.findIndex(
    (sem) => sem.name === cachedSemesterName && sem.year === cachedYear
  );
};

// loads timetable from localStorage. assumes that the browser supports localStorage
export const loadCachedTimetable =
  (allSemesters, oldSemesters) => (dispatch, getState) => {
    dispatch(timetablesActions.loadingCachedTimetable());
    // load timetable information from local storage
    const localCourseSections = JSON.parse(localStorage.getItem("courseSections"));
    const localPreferences = JSON.parse(localStorage.getItem("preferences"));
    const localActive = parseInt(localStorage.getItem("active"), 10);
    const matchedIndex = getSemesterIndex(allSemesters, oldSemesters);

    // validate local storage info
    const cachedSemesterNotFound = matchedIndex === -1;
    const cachedCourseSectionsExist =
      localCourseSections && Object.keys(localCourseSections).length > 0;
    const cachedPreferencesExist =
      localPreferences && Object.keys(localPreferences).length > 0;
    const isCachedTimetableDataValid =
      cachedCourseSectionsExist && cachedPreferencesExist && !cachedSemesterNotFound;

    if (!isCachedTimetableDataValid) {
      // switch back to default semester
      dispatch(nullifyTimetable(dispatch));
    } else {
      let personalTimetablesExist = false;
      if (getState().userInfo.data.isLoggedIn) {
        dispatch(getUserSavedTimetables(allSemesters[matchedIndex]));
        personalTimetablesExist =
          Object.keys(getState().courseSections.objects).length > 0;
      }
      if (!personalTimetablesExist) {
        // if no personal TTs and local storage data is valid, load cached timetable
        dispatch(preferencesActions.setAllPreferences(localPreferences));
        dispatch(semesterActions.updateSemester(matchedIndex));
        dispatch(courseSectionsActions.receiveCourseSections(localCourseSections));
        dispatch(fetchStateTimetables(localActive));
      }
    }
    dispatch(timetablesActions.cachedTimetableLoaded());
  };

/*
 * Numbers the provided string based on the number of other timetables with
 * that name. e.g. getNumberedName("Untitled") -> "Untitled 2" if there are 2
 * other timetables with "Untitled" in the title, or "Untitled" if there
 * no others.
 */
export const getNumberedName = (name, timetables) => {
  const tokens = name.split(" ");
  const nameBase = !isNaN(tokens[tokens.length - 1])
    ? tokens.slice(0, tokens.length - 1).join(" ")
    : name;
  let numberSuffix = timetables.filter((t) => t.name.indexOf(nameBase) > -1).length;
  numberSuffix = numberSuffix === 0 ? "" : ` ${numberSuffix}`;
  return nameBase + numberSuffix;
};

export const handleCreateNewTimetable = () => (dispatch, getState) => {
  const state = getState();
  const isLoggedIn = state.userInfo.data.isLoggedIn;
  if (!isLoggedIn) {
    return dispatch(signupModalActions.showSignupModal());
  }

  if (getActiveTimetable(state).slots.length > 0 && !state.savingTimetable.upToDate) {
    return dispatch(alertsActions.alertNewTimeTable());
  }

  return dispatch(
    createNewTimetable(
      getNumberedName("Untitled Schedule", state.userInfo.data.timetables)
    )
  );
};

/*
 Attempts to add the course represented by newCourseId
 to the user's roster. If a section is provided, that section is
 locked. Otherwise, no section is locked.
 */
export const addOrRemoveCourse =
  (courseId, section = "") =>
  (dispatch, getState) => {
    let state = getState();
    if (state.timetables.isFetching) {
      return;
    }

    const removing =
      state.courseSections.objects[courseId] !== undefined && section === "";
    let reqBody = getBaseReqBody(state);
    if (state.optionalCourses.courses.some((c) => c === courseId)) {
      dispatch(removeOptionalCourseById(courseId));
      reqBody = getBaseReqBody(state);
    }

    state = getState();
    if (removing) {
      const updatedCourseSections = Object.assign({}, state.courseSections.objects);
      delete updatedCourseSections[courseId]; // remove it from courseSections.objects
      reqBody.courseSections = updatedCourseSections;
      Object.assign(reqBody, {
        optionCourses: state.optionalCourses.courses,
        numOptionCourses: state.optionalCourses.numRequired,
        customEvents: state.customEvents,
      });
    } else {
      // adding a course
      dispatch(timetablesActions.updateLastCourseAdded({ courseId, section }));
      state = getState();
      Object.assign(reqBody, {
        updated_courses: [
          {
            course_id: courseId,
            section_codes: [section],
          },
        ],
        optionCourses: state.optionalCourses.courses,
        numOptionCourses: state.optionalCourses.numRequired,
        customEvents: state.customEvents,
      });
    }

    // user must be removing this course if it's already in roster,
    // and they're not trying to lock a new section).
    // otherwise, they're adding it
    dispatch(fetchTimetables(reqBody, removing));
  };

export const addLastAddedCourse = () => (dispatch, getState) => {
  const state = getState();
  // last timetable change was a custom event edit, not add
  if (state.timetables.lastCourseAdded === null) {
    return;
  }
  const { courseId, section } = state.timetables.lastCourseAdded;
  dispatch(addOrRemoveCourse(courseId, section));
};

export const addCustomSlot = (timeStart, timeEnd, day, preview, id) => (dispatch) => {
  dispatch(
    customEventsActions.addNewCustomEvent({
      day,
      name: "New Custom Event", // default name for custom slot
      location: "",
      color: "#F8F6F7",
      time_start: timeStart, // match backend slot attribute names
      time_end: timeEnd,
      credits: 0.0,
      id,
      preview,
    })
  );
  dispatch(savingTimetableActions.setUpToDate(false));
};

export const removeCustomSlot = (id) => (dispatch, getState) => {
  fetch(getPersonalEventEndpoint(), {
    headers: {
      "X-CSRFToken": Cookie.get("csrftoken"),
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "DELETE",
    body: JSON.stringify({
      id,
      timetable: getState().savingTimetable.activeTimetable.id,
    }),
    credentials: "include",
  }).then(() => dispatch(removeCustomEvent(id)));
};

function isNewTimeLessThan10Minutes(timeStart, timeEnd) {
  if (timeStart && timeEnd) {
    return convertToMinutes(timeEnd) - convertToMinutes(timeStart) < 10;
  }
  return false;
}

function goesPastMidnight(timeEnd) {
  if (timeEnd) {
    return convertToMinutes(timeEnd) > convertToMinutes("23:59");
  }
  return false;
}

export const updateCustomSlot = (newValues, id) => (dispatch, getState) => {
  newValues.id = id;
  const event = getState().customEvents.events.find((e) => e.id === id);
  if (!event) {
    return;
  }
  if (event.preview) {
    dispatch(updateExistingEvent(newValues));
  } else if (isNewTimeLessThan10Minutes(newValues.time_start, newValues.time_end)) {
    dispatch(removeCustomSlot(id));
    // For some reason, students can drag and drop past midnight
  } else if (!goesPastMidnight(newValues.timeEnd)) {
    updateEvent(dispatch, newValues);
  }
};

const updateEvent = (dispatch, newValues) => {
  fetch(getPersonalEventEndpoint(), {
    headers: {
      "X-CSRFToken": Cookie.get("csrftoken"),
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "PUT",
    body: JSON.stringify(newValues),
    credentials: "include",
  }).then(() => {
    dispatch(updateExistingEvent(newValues));
  });
};

export const finalizeCustomSlot = (id) => (dispatch, getState) => {
  const event = getState().customEvents.events.find((e) => e.id === id);
  if (!event) {
    return;
  }

  if (isNewTimeLessThan10Minutes(event.time_start, event.time_end)) {
    dispatch(customEventsActions.deletePreviewEvent(id));
    dispatch(savingTimetableActions.setUpToDate(true));
    return;
  }

  // if no timetable id, create a new timetable which will automatically save the new event
  if (!getState().savingTimetable.activeTimetable.id) {
    dispatch(fetchStateTimetables());
    return;
  }

  fetch(getPersonalEventEndpoint(), {
    headers: {
      "X-CSRFToken": Cookie.get("csrftoken"),
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      timetable: getState().savingTimetable.activeTimetable.id,
      ...event,
    }),
    credentials: "include",
  })
    .then((res) => res.json())
    .then((newEvent) => {
      dispatch(
        customEventsActions.replacePreviewEvent({
          oldId: id,
          newId: newEvent.id,
        })
      );
      dispatch(savingTimetableActions.setUpToDate(true));
    });
};

export const addOrRemoveOptionalCourse = (course) => (dispatch, getState) => {
  const removing = getState().optionalCourses.courses.some((c) => c === course.id);
  if (getState().timetables.isFetching) {
    return;
  }

  dispatch(addRemoveOptionalCourse(course.id));
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
