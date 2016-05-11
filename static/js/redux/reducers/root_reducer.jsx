import { combineReducers } from 'redux';
import { school } from './school_reducer.jsx';
import { semester } from './semester_reducer.jsx';
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
import { explorationModal } from './exploration_modal_reducer.jsx';

export const rootReducer = combineReducers({
  school,
  semester,
  searchResults,
  timetables,
  courseSections,
  preferences,
  courseInfo,
  alerts,
  ui,
  userInfo,
  savingTimetable,
  classmates,
  explorationModal
});
