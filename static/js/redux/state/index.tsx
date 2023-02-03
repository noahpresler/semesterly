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

import { configureStore } from "@reduxjs/toolkit";
import { createSelector } from "reselect";
import { getMaxHourBasedOnWindowHeight } from "../util";
import school from "./slices/schoolSlice";
import semester, * as fromSemester from "../state/slices/semesterSlice";
import calendar from "./slices/calendarSlice";
import courseSections from "./slices/courseSectionsSlice";
import timetables, * as fromTimetables from "./slices/timetablesSlice";
import searchResults, * as fromSearchResults from "./slices/searchResultsSlice";
import preferences from "./slices/preferencesSlice";
import courseInfo from "./slices/courseInfoSlice";
import alerts from "./slices/alertsSlice";
import ui from "./slices/uiSlice";
import userInfo, { isUserInfoIncomplete } from "./slices/userInfoSlice";
import savingTimetable from "./slices/savingTimetableSlice";
import classmates from "./slices/classmatesSlice";
import advancedSearch, {
  getAdvancedSearchResultIds,
} from "./slices/advancedSearchSlice";
import customEvents from "./slices/customEventsSlice";
import signupModal from "./slices/signupModalSlice";
import peerModal from "./slices/peerModalSlice";
import friends from "./slices/friendsSlice";
import newsModal from "./slices/newsModalSlice";
import saveCalendarModal from "./slices/saveCalendarModalSlice";
import termsOfServiceModal from "./slices/termsOfServiceModalSlice";
import termsOfServiceBanner from "./slices/termOfServiceBannerSlice";
import userAcquisitionModal from "./slices/userAcquisitionModalSlice";
import compareTimetable from "./slices/compareTimetableSlice";
import registrar from "./slices/registrarSlice";
import entities, * as fromEntities from "./slices/entitiesSlice";
import theme from "./slices/themeSlice";
import { Slot, Timetable } from "../constants/commonTypes";

export const reducers = {
  alerts,
  calendar,
  classmates,
  courseInfo,
  courseSections,
  customEvents,
  entities,
  advancedSearch,
  friends,
  newsModal,
  peerModal,
  preferences,
  registrar,
  saveCalendarModal,
  savingTimetable,
  school,
  searchResults,
  semester,
  signupModal,
  termsOfServiceBanner,
  termsOfServiceModal,
  theme,
  timetables,
  ui,
  userAcquisitionModal,
  userInfo,
  compareTimetable,
};

const store = configureStore({ reducer: reducers });

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// timetable/entity selectors
export const getTimetables = (state: RootState) =>
  fromTimetables.getTimetables(state.timetables);

export const getDenormCourseById = (state: RootState, id: number) =>
  fromEntities.getDenormCourseById(state.entities, id);

export const getCurrentSemester = (state: RootState) =>
  fromSemester.getCurrentSemester(state.semester);

export const getActiveTimetable = (state: RootState) =>
  fromTimetables.getActiveTimetable(state.timetables);

export const getDenormTimetable = (state: RootState, timetable: Timetable) =>
  fromEntities.getDenormTimetable(state.entities, timetable);

export const getActiveDenormTimetable = (state: RootState) =>
  getDenormTimetable(state, getActiveTimetable(state));

export const getActiveTimetableCourses = (state: RootState) =>
  fromEntities.getTimetableCourses(state.entities, getActiveTimetable(state));

export const getActiveTimetableDenormCourses = (state: RootState) =>
  fromEntities.getTimetableDenormCourses(state.entities, getActiveTimetable(state));

export const getCoursesFromSlots = (state: RootState, slots: Slot[]) =>
  fromEntities.getCoursesFromSlots(state.entities, slots);

export const getMaxTTEndHour = createSelector(
  // @ts-ignore
  [getActiveDenormTimetable],
  fromEntities.getMaxEndHour
);

export const getHoveredSlots = (state: RootState) =>
  fromTimetables.getHoveredSlots(state.timetables);

// Don't use createSelector to memoize getMaxEndHour
export const getMaxEndHour = (state: RootState) =>
  Math.max(getMaxTTEndHour(state), getMaxHourBasedOnWindowHeight());

// search selectors
const getSearchResultId = (state: RootState, index: number) =>
  fromSearchResults.getSearchResultId(state.searchResults, index);

const getSearchResultIds = (state: RootState) =>
  fromSearchResults.getSearchResultIds(state.searchResults);

export const getSearchResult = (state: RootState, index: number) =>
  getDenormCourseById(state, getSearchResultId(state, index));

export const getSearchResults = (state: RootState) =>
  getSearchResultIds(state).map((resultId: number) =>
    getDenormCourseById(state, resultId)
  );

export const getDenormAdvancedSearchResults = (state: RootState) =>
  getAdvancedSearchResultIds(state.advancedSearch).map((id: number) =>
    getDenormCourseById(state, id)
  );

// modal selectors
export const getIsUserInfoIncomplete = (state: RootState) =>
  isUserInfoIncomplete(state.userInfo.data);

export default store;
