import { connect } from 'react-redux';
import CourseModal from '../../modals/course_modal';
import {
  getActiveTT,
  getCurrentSemester,
  getDenormCourseById,
  getCourseInfoId,
} from '../../../reducers/root_reducer';
import {
    addOrRemoveCourse,
    addOrRemoveOptionalCourse,
    hoverSection,
    unHoverSection,
} from '../../../actions/timetable_actions';
import {
    changeUserInfo,
    fetchCourseInfo,
    openSignUpModal,
    react,
    setCourseId,
} from '../../../actions/modal_actions';
import { saveSettings } from '../../../actions/user_actions';
import { getCourseShareLink, getCourseShareLinkFromModal } from '../../../constants/endpoints';

const mapStateToProps = (state) => {
  const courseSections = state.courseSections.objects;
  const activeTimetable = getActiveTT(state);
  const courseInfoId = getCourseInfoId(state);
  const denormCourseInfo = !courseInfoId ? {} : getDenormCourseById(state, courseInfoId);
  return {
    data: denormCourseInfo,
    id: state.courseInfo.id,
    isFetching: state.courseInfo.isFetching,
    hasHoveredResult: activeTimetable.courses.some(course => course.fake),
    inRoster: courseSections[state.courseInfo.id] !== undefined,
    getShareLink: courseCode => getCourseShareLink(courseCode, getCurrentSemester(state)),
    getShareLinkFromModal: courseCode =>
      getCourseShareLinkFromModal(courseCode, getCurrentSemester(state)),
  };
};

const CourseModalContainer = connect(
    mapStateToProps,
  {
    hideModal: () => setCourseId(null),
    openSignUpModal,
    fetchCourseInfo,
    hoverSection,
    unHoverSection,
    addOrRemoveOptionalCourse,
    addOrRemoveCourse,
    react,
    saveSettings,
    changeUserInfo,
  },
)(CourseModal);

export default CourseModalContainer;
