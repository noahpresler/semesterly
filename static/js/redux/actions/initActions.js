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

export const updateExistingEvent = createAction("global/updateExistingEvent");

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
  (courses) => ({
    payload: normalize(courses, [courseSchema]),
  })
);

export const receiveAdvancedSearchResults = createAction(
  "global/receiveAdvancedSearchResults",
  (response) => ({
    payload: { courses: normalize(response.data, [courseSchema]), page: response.page },
  })
);

export const requestCourses = createAction("global/requestCourses");
