import { connect } from 'react-redux';
import ExplorationModal from '../exploration_modal';
import {
    clearAdvancedSearchPagination,
    fetchAdvancedSearchResults,
    paginateAdvancedSearchResults,
    setAdvancedSearchResultIndex,
} from '../../actions/search_actions';
import {
    addOrRemoveCourse,
    addOrRemoveOptionalCourse,
    hoverSection,
    unHoverSection,
} from '../../actions/timetable_actions';
import { saveSettings } from '../../actions/user_actions';
import { getSchoolSpecificInfo } from '../../constants/schools';
import {
    fetchCourseClassmates,
    hideExplorationModal,
    openSignUpModal,
    react,
    changeUserInfo,
    fetchCourseInfo,
} from '../../actions/modal_actions';

const mapStateToProps = (state) => {
  const { isVisible, advancedSearchResults, isFetching, active, page } = state.explorationModal;
  const courseSections = state.courseSections.objects;
  const course = advancedSearchResults[active];
  const inRoster = course && (courseSections[course.id] !== undefined);
  const activeTimetable = state.timetables.items[state.timetables.active];
  const { areas, departments, levels } = state.school;
  const semester = allSemesters[state.semesterIndex];
  return {
    isVisible,
    isFetching,
    advancedSearchResults,
    active,
    course,
    inRoster,
    areas,
    departments,
    levels,
    page,
    semesterName: `${semester.name} ${semester.year}`,
    schoolSpecificInfo: getSchoolSpecificInfo(state.school.school),
    userInfo: state.userInfo.data,
    isLoggedIn: state.userInfo.data.isLoggedIn,
    hasHoveredResult: activeTimetable.courses.some(c => c.fake),
    classmates: state.courseInfo.classmates,
    isFetchingClassmates: state.courseInfo.isFetching,
    isSectionLocked: (courseId, section) => {
      if (courseSections[courseId] === undefined) {
        return false;
      }
      return Object.keys(courseSections[courseId]).some(
                type => courseSections[courseId][type] === section,
            );
    },
    isSectionOnActiveTimetable: (courseId, section) => activeTimetable.courses.some(
                c => c.id === courseId &&
                c.enrolled_sections.some(sec => sec === section),
            ),
  };
};

const ExplorationModalContainer = connect(
    mapStateToProps,
  {
    hideExplorationModal,
    openSignUpModal,
    fetchAdvancedSearchResults,
    fetchCourseClassmates,
    addOrRemoveOptionalCourse,
    hoverSection,
    unHoverSection,
    addOrRemoveCourse,
    react,
    paginate: paginateAdvancedSearchResults,
    clearPagination: clearAdvancedSearchPagination,
    setAdvancedSearchResultIndex,
    changeUserInfo,
    saveSettings,
    fetchCourseInfo,
  },
)(ExplorationModal);

export default ExplorationModalContainer;
