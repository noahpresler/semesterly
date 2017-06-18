import { combineReducers } from 'redux';
import school from './school_reducer';
import semester, * as fromSemester from './semester_reducer';
import calendar from './calendar_reducer';
import courseSections from './course_sections_reducer';
import timetables, * as fromTimetables from './timetables_reducer';
import searchResults, * as fromSearchResults from './search_results_reducer';
import preferences from './preferences_reducer';
import courseInfo from './course_info_reducer';
import alerts from './alerts_reducer';
import ui from './ui_reducer';
import userInfo from './user_info_reducer';
import savingTimetable from './saving_timetable_reducer';
import classmates from './classmates_reducer';
import optionalCourses from './optional_courses_reducer';
import explorationModal from './exploration_modal_reducer';
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
  school,
  semester,
  searchResults,
  timetables,
  calendar,
  courseSections,
  preferences,
  courseInfo,
  alerts,
  ui,
  userInfo,
  savingTimetable,
  classmates,
  optionalCourses,
  explorationModal,
  customSlots,
  signupModal,
  preferenceModal,
  friends,
  peerModal,
  notificationToken,
  integrationModal,
  integrations,
  saveCalendarModal,
  userAcquisitionModal,
  termsOfServiceModal,
  termsOfServiceBanner,
  textbookModal,
  finalExamsModal,
  entities,
});

export const getActiveTT = state => fromTimetables.getActiveTT(state.timetables);

const getSearchResultId = (state, index) =>
  fromSearchResults.getSearchResultId(state.searchResults, index);

const getSearchResultIds = state => fromSearchResults.getSearchResultIds(state.searchResults);

const getDenormCourseById = (state, id) => fromEntities.getDenormCourseById(state.entities, id);

// Take search result index and return the full, denormalized course at that index
export const getSearchResult = (state, index) =>
  getDenormCourseById(state, getSearchResultId(state, index));

export const getSearchResults = state =>
  getSearchResultIds(state).map(resultId => getDenormCourseById(state, resultId));

export const getCurrentSemester = state => fromSemester.getCurrentSemester(state.semester);

export default rootReducer;
