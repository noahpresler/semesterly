import { combineReducers } from 'redux';
import { school } from './school_reducer.jsx';
import { semester } from './semester_reducer.jsx';
import { courseSections } from './course_sections_reducer.jsx';
import { timetables } from './timetables_reducer.jsx';
import { searchResults } from './search_results_reducer.jsx';
import { preferences } from './preferences_reducer.jsx';

export const rootReducer = combineReducers({
  school,
  semester,
  searchResults,
  timetables,
  courseSections,
  preferences,
});
