import { connect } from 'react-redux';
import {
    fetchSearchResults,
    hoverSearchResult,
    maybeSetSemester,
} from '../../actions/search_actions';
import { getCurrentSemester, getSearchResults, getHoveredSlots } from '../../reducers/root_reducer';
import { addOrRemoveCourse, addOrRemoveOptionalCourse } from '../../actions/timetable_actions';
import SearchBar from '../search_bar';
import { fetchCourseInfo, showExplorationModal } from '../../actions/modal_actions';
import { getSchoolSpecificInfo } from '../../constants/schools';
import { openIntegrationModal } from '../../actions/user_actions';

const mapStateToProps = (state) => {
  const { isVisible } = state.explorationModal;
  const courseSections = state.courseSections.objects;
  const schoolSpecificInfo = getSchoolSpecificInfo(state.school.school);
  const schoolSpecificCampuses = schoolSpecificInfo.campuses;
  return {
    semester: getCurrentSemester(state),
    allSemesters: state.semester.all,
    campuses: schoolSpecificCampuses,
    searchResults: getSearchResults(state),
    isFetching: state.searchResults.isFetching,
    isCourseInRoster: courseId => courseSections[courseId] !== undefined,
    isCourseOptional: courseId => state.optionalCourses.courses.some(c => c === courseId),
    hasHoveredResult: getHoveredSlots(state) !== null,
    isHovered: position => state.ui.searchHover === position,
    hoveredPosition: state.ui.searchHover,
    explorationModalIsVisible: isVisible,
  };
};

const SearchBarContainer = connect(
    mapStateToProps,
  {
    fetchCourses: fetchSearchResults,
    addCourse: addOrRemoveCourse,
    addRemoveOptionalCourse: addOrRemoveOptionalCourse,
    fetchCourseInfo,
    showExplorationModal,
    showIntegrationModal: openIntegrationModal,
    hoverSearchResult,
    maybeSetSemester,
  },
)(SearchBar);

export default SearchBarContainer;
