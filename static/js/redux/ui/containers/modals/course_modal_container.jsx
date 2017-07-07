import { connect } from 'react-redux';
import CourseModal from '../../modals/course_modal';
import {
  getCurrentSemester,
  getDenormCourseById,
  getCourseInfoId,
  getHoveredSlots,
} from '../../../reducers/root_reducer';
import {
    addOrRemoveCourse,
    addOrRemoveOptionalCourse,
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
  const courseInfoId = getCourseInfoId(state);
  const denormCourseInfo = !courseInfoId ? {} : getDenormCourseById(state, courseInfoId);
  return {
    classmates: state.courseInfo.classmates,
    data: denormCourseInfo,
    id: state.courseInfo.id,
    isFetching: state.courseInfo.isFetching,
    hasHoveredResult: getHoveredSlots(state).length > 0,
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
    unHoverSection,
    addOrRemoveOptionalCourse,
    addOrRemoveCourse,
    react,
    saveSettings,
    changeUserInfo,
  },
)(CourseModal);

export default CourseModalContainer;
