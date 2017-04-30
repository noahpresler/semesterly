import { connect } from 'react-redux';
import {
    fetchSearchResults,
    hoverSearchResult,
    maybeSetSemester,
} from '../../actions/search_actions';
import { addOrRemoveCourse, addOrRemoveOptionalCourse } from '../../actions/timetable_actions';
import { SearchBar } from '../search_bar';
import { fetchCourseInfo, showExplorationModal } from '../../actions/modal_actions';
import { getSchoolSpecificInfo } from '../../constants/schools';
import { openIntegrationModal } from '../../actions/user_actions';
import { currSem } from '../../reducers/semester_reducer';

const mapStateToProps = (state) => {
  const { isVisible } = state.explorationModal;
  const courseSections = state.courseSections.objects;
  const schoolSpecificInfo = getSchoolSpecificInfo(state.school.school);
  const schoolSpecificCampuses = schoolSpecificInfo.campuses;
  return {
    semester: currSem(state.semester),
    allSemesters: state.semester.all,
    campuses: schoolSpecificCampuses,
    searchResults: state.searchResults.items,
    isFetching: state.searchResults.isFetching,
    isCourseInRoster: courseId => courseSections[courseId] !== undefined,
    isCourseOptional: courseId => state.optionalCourses.courses.some(c => c.id === courseId),
    hasHoveredResult: state.timetables.items[state.timetables.active]
      .courses.some(course => course.fake),
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
