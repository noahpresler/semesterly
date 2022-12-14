import { Theme } from "./../constants/commonTypes";
import { createAction } from "@reduxjs/toolkit";
import { normalize } from "normalizr";
import { courseSchema } from "../schema";

// the INIT_STATE action typed version
export const initAllState = createAction("global/init");

export const alertConflict = createAction("global/alertConflict");

// ALERT_TIMETABLE_EXISTS
export const alertTimeTableExists = createAction("global/alertTimeTableExists");

// course related actions

/**
 * action creator that normalizes `courseInfo`
 * into `offering_set`, `sections`, `courses`
 * and processed within entities reducer
 */
export const setCourseInfo = createAction("global/setCourseInfo", (courseInfo) => ({
  payload: normalize(courseInfo, courseSchema),
}));

export const setCourseReactions = createAction("global/setCourseReactions");

export const receiveTimetables = createAction("global/receiveTimetables");

/**
 * normalizes multiple courses
 */
export const receiveCourses = createAction("global/receiveCourses", (courses) => ({
  payload: normalize(courses, [courseSchema]),
}));

export const changeActiveTimetable = createAction("global/changeActiveTimetable");

export const changeActiveSavedTimetable = createAction(
  "global/changeActiveSavedTimetable"
);

export const receiveSchoolInfo = createAction("global/receiveSchoolInfo");

/**
 * normalizes search results as `payload` and store them in entities
 * save unormalized one as `original`
 */
export const receiveSearchResults = createAction(
  "global/receiveSearchResults",
  (response) => ({
    payload: { courses: normalize(response.data, [courseSchema]), page: response.page },
  })
);

export const receiveAdvancedSearchResults = createAction(
  "global/receiveAdvancedSearchResults",
  (response) => ({
    payload: { courses: normalize(response.data, [courseSchema]), page: response.page },
  })
);

export const requestCourses = createAction("global/requestCourses");

export const setTheme = createAction("global/setTheme", (theme: Theme) => ({
  payload: theme,
}));

// Preferences related actions

/**
 * This is required because toggling show weekends does not cause a re-fetch, so we have
 * to update the timetable state in addition to the preferences state. This is in
 * contrast to has_conflict/tryWithConflict, which is immediately set because the
 * timetable is fetched as it automatically adds a course once it's toggled.
 *
 * Note this only matters for savingTimetableSlice & userInfoSlice since when the user
 * is not logged in, they can only have one timetable and preferences are handled by
 * browser storage, so the timetable can never be out of sync with the preferences.
 */
export const setShowWeekend = createAction(
  "global/setShowWeekend",
  (showWeekend: boolean) => ({ payload: showWeekend })
);
