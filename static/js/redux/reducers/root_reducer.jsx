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

import { combineReducers } from 'redux';
import { createSelector } from 'reselect';
import { getMaxHourBasedOnWindowHeight } from '../util';
import school from './school_reducer';
import semester, * as fromSemester from './semester_reducer';
import calendar from './calendar_reducer';
import courseSections from './course_sections_reducer';
import timetables, * as fromTimetables from './timetables_reducer';
import searchResults, * as fromSearchResults from './search_results_reducer';
import preferences from './preferences_reducer';
import courseInfo, * as fromCourseInfo from './course_info_reducer';
import alerts from './alerts_reducer';
import ui from './ui_reducer';
import userInfo, * as fromUserInfo from './user_info_reducer';
import savingTimetable from './saving_timetable_reducer';
import classmates from './classmates_reducer';
import optionalCourses from './optional_courses_reducer';
import explorationModal, * as fromExplorationModal from './exploration_modal_reducer';
import customSlots from './custom_slots_reducer';
import signupModal from './signup_modal_reducer';
import peerModal from './peer_modal_reducer';
import preferenceModal from './preference_modal_reducer';
import friends from './friends_reducer';
import notificationToken from './notification_token_reducer';
import integrationModal from './integration_modal_reducer';
import integrations from './integrations_reducer';
import saveCalendarModal from './save_calendar_modal_reducer';
import termsOfServiceModal from './terms_of_service_modal_reducer';
import termsOfServiceBanner from './terms_of_service_banner_reducer';
import userAcquisitionModal from './user_acquisition_modal_reducer';
import textbookModal from './textbook_modal_reducer';
import finalExamsModal from './final_exams_modal_reducer';
import entities, * as fromEntities from './entities_reducer';

const rootReducer = combineReducers({
  alerts,
  calendar,
  classmates,
  courseInfo,
  courseSections,
  customSlots,
  entities,
  explorationModal,
  finalExamsModal,
  friends,
  integrationModal,
  integrations,
  notificationToken,
  optionalCourses,
  peerModal,
  preferenceModal,
  preferences,
  saveCalendarModal,
  savingTimetable,
  school,
  searchResults,
  semester,
  signupModal,
  termsOfServiceBanner,
  termsOfServiceModal,
  textbookModal,
  timetables,
  ui,
  userAcquisitionModal,
  userInfo,
});

// timetable/entity selectors
export const getTimetables = state => fromTimetables.getTimetables(state.timetables);

export const getDenormCourseById = (state, id) =>
  fromEntities.getDenormCourseById(state.entities, id);

export const getCurrentSemester = state => fromSemester.getCurrentSemester(state.semester);

export const getActiveTimetable = state => fromTimetables.getActiveTimetable(state.timetables);

export const getDenormTimetable = (state, timetable) =>
  fromEntities.getDenormTimetable(state.entities, timetable);

export const getActiveDenormTimetable = state =>
  getDenormTimetable(state, getActiveTimetable(state));

export const getActiveTimetableCourses = state =>
  fromEntities.getTimetableCourses(state.entities, getActiveTimetable(state));

export const getActiveTimetableDenormCourses = state =>
  fromEntities.getTimetableDenormCourses(state.entities, getActiveTimetable(state));

export const getCoursesFromSlots = (state, slots) =>
  fromEntities.getCoursesFromSlots(state.entities, slots);

export const getMaxTTEndHour = createSelector([getActiveDenormTimetable],
  fromEntities.getMaxEndHour);

export const getHoveredSlots = state => fromTimetables.getHoveredSlots(state.timetables);

// Don't use createSelector to memoize getMaxEndHour
export const getMaxEndHour = state =>
  Math.max(getMaxTTEndHour(state), getMaxHourBasedOnWindowHeight());

// search selectors
const getSearchResultId = (state, index) =>
  fromSearchResults.getSearchResultId(state.searchResults, index);

const getSearchResultIds = state => fromSearchResults.getSearchResultIds(state.searchResults);

export const getSearchResult = (state, index) =>
  getDenormCourseById(state, getSearchResultId(state, index));

export const getSearchResults = state =>
  getSearchResultIds(state).map(resultId => getDenormCourseById(state, resultId));

export const getDenormAdvancedSearchResults = state =>
  fromExplorationModal.getAdvancedSearchResultIds(state.explorationModal).map(id =>
    getDenormCourseById(state, id));

// modal selectors
export const getCourseInfoId = state => fromCourseInfo.getCourseInfoId(state.courseInfo);

export const getIsUserInfoIncomplete = state =>
  fromUserInfo.isUserInfoIncomplete(state.userInfo);

export default rootReducer;
