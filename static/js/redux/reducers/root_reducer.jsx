import { combineReducers } from 'redux';
import { school } from './school_reducer.jsx';
import { semesterIndex } from './semester_reducer.jsx';
import { calendar } from './calendar_reducer.jsx';
import { courseSections } from './course_sections_reducer.jsx';
import { timetables } from './timetables_reducer.jsx';
import { searchResults } from './search_results_reducer.jsx';
import { preferences } from './preferences_reducer.jsx';
import { courseInfo } from './course_info_reducer.jsx';
import { alerts } from './alerts_reducer.jsx';
import { ui } from './ui_reducer.jsx'
import { userInfo } from './user_info_reducer.jsx'
import { savingTimetable } from './saving_timetable_reducer.jsx';
import { classmates } from './classmates_reducer.jsx';
import { optionalCourses } from './optional_courses_reducer.jsx';
import { explorationModal } from './exploration_modal_reducer.jsx';
import { customSlots } from './custom_slots_reducer.jsx'
import { signupModal } from './signup_modal_reducer.jsx';
import { peerModal } from './peer_modal_reducer.jsx';
import { preferenceModal } from './preference_modal_reducer.jsx'
import { friends } from './friends_reducer.jsx';
import { notificationToken } from './notification_token_reducer.jsx';
import { integrationModal } from './integration_modal_reducer.jsx'
import { saveCalendarModal } from './save_calendar_modal_reducer.jsx'
import { userAcquisitionModal } from './user_acquisition_modal_reducer.jsx'
import { textbookModal } from './textbook_modal_reducer.jsx'
import { dtmCalendars } from './dtm_calendar_reducer.jsx'
import { weeklyCalendar } from './weekly_calendar_reducer.jsx'
import { dtmShare } from './dtm_share_reducer.jsx'
import { finalExamsModal } from './final_exams_modal_reducer.jsx'

export const rootReducer = combineReducers({
  school,
  semesterIndex,
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
  saveCalendarModal,
  userAcquisitionModal,
  textbookModal,
  dtmCalendars,
  weeklyCalendar,
  dtmShare,
  finalExamsModal
});
