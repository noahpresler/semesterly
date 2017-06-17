import { connect } from 'react-redux';
import CourseModal from '../../modals/course_modal';
import { getActiveTT } from '../../../reducers/root_reducer';
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
import { currSem } from '../../../reducers/semester_reducer';

const mapStateToProps = (state) => {
  const courseSections = state.courseSections.objects;
  const activeTimetable = getActiveTT(state);
  return {
    data: state.courseInfo.data,
    id: state.courseInfo.id,
    hasHoveredResult: activeTimetable.courses.some(course => course.fake),
    inRoster: courseSections[state.courseInfo.id] !== undefined,
    getShareLink: courseCode => getCourseShareLink(courseCode, currSem(state.semester)),
    getShareLinkFromModal: courseCode =>
      getCourseShareLinkFromModal(courseCode, currSem(state.semester)),
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
