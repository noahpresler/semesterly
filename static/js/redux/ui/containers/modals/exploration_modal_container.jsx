import { connect } from 'react-redux';
import {
  getActiveTT,
  getCurrentSemester,
  getDenormAdvancedSearchResults,
} from '../../../reducers/root_reducer';
import ExplorationModal from '../../modals/exploration_modal';
import {
    clearAdvancedSearchPagination,
    fetchAdvancedSearchResults,
    paginateAdvancedSearchResults,
    setAdvancedSearchResultIndex,
} from '../../../actions/search_actions';
import {
    addOrRemoveCourse,
    addOrRemoveOptionalCourse,
    unHoverSection,
} from '../../../actions/timetable_actions';
import { getSchoolSpecificInfo } from '../../../constants/schools';
import {
    fetchCourseClassmates,
    hideExplorationModal,
} from '../../../actions/modal_actions';
import { getCourseShareLinkFromModal } from '../../../constants/endpoints';


const mapStateToProps = (state) => {
  const { isVisible, isFetching, active, page } = state.explorationModal;
  const advancedSearchResults = getDenormAdvancedSearchResults(state);
  const courseSections = state.courseSections.objects;
  const course = advancedSearchResults[active];
  const inRoster = course && (courseSections[course.id] !== undefined);
  const activeTimetable = getActiveTT(state);
  const { areas, departments, levels } = state.school;
  const semester = getCurrentSemester(state);
  return {
    isVisible,
    isFetching,
    advancedSearchResults,
    active,
    inRoster,
    areas,
    departments,
    levels,
    page,
    semesterName: `${semester.name} ${semester.year}`,
    schoolSpecificInfo: getSchoolSpecificInfo(state.school.school),
    hasHoveredResult: activeTimetable.courses.some(c => c.fake),
    getShareLink: courseCode => getCourseShareLinkFromModal(courseCode, getCurrentSemester(state)),
  };
};

const ExplorationModalContainer = connect(
    mapStateToProps,
  {
    hideExplorationModal,
    fetchAdvancedSearchResults,
    fetchCourseClassmates,
    addOrRemoveOptionalCourse,
    unHoverSection,
    addOrRemoveCourse,
    paginate: paginateAdvancedSearchResults,
    clearPagination: clearAdvancedSearchPagination,
    setAdvancedSearchResultIndex,
  },
)(ExplorationModal);

export default ExplorationModalContainer;
