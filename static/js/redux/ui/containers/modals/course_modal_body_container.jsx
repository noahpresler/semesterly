import { connect } from 'react-redux';
import CourseModalBody from '../../modals/course_modal_body';
import {
  getActiveTT,
  getCurrentSemester,
} from '../../../reducers/root_reducer';
import { getSectionTypeToSections } from '../../../reducers/entities_reducer';
import { hoverSection } from '../../../actions/timetable_actions';
import {
    changeUserInfo,
    fetchCourseInfo,
    openSignUpModal,
    react,
} from '../../../actions/modal_actions';
import { saveSettings } from '../../../actions/user_actions';
import { getSchoolSpecificInfo } from '../../../constants/schools';
import { getCourseShareLink, getCourseShareLinkFromModal } from '../../../constants/endpoints';

const mapStateToProps = (state, ownProps) => {
  const denormCourseInfo = ownProps.data;
  const sectionTypeToSections = getSectionTypeToSections(denormCourseInfo);
  const courseSections = state.courseSections.objects;
  const activeTimetable = getActiveTT(state);
  return {
    ...ownProps,
    schoolSpecificInfo: getSchoolSpecificInfo(state.school.school),
    isFetching: state.courseInfo.isFetching,
    isFetchingClassmates: state.courseInfo.isFetching,
    classmates: state.courseInfo.classmates,
    sectionTypeToSections,
    popularityPercent: denormCourseInfo.popularity_percent * 100,
    isLoggedIn: state.userInfo.data.isLoggedIn,
    hasSocial: state.userInfo.data.social_courses && state.userInfo.data.social_offerings,
    userInfo: state.userInfo.data,
    isSectionLocked: (courseId, section) => {
      if (courseSections[courseId] === undefined) {
        return false;
      }
      return Object.keys(courseSections[courseId]).some(
                type => courseSections[courseId][type] === section,
            );
    },
    isSectionOnActiveTimetable: (courseId, section) => activeTimetable.courses
      .some(course => course.id === courseId
      && course.enrolled_sections.some(sec => sec === section)),
    getShareLink: courseCode => getCourseShareLink(courseCode, getCurrentSemester(state)),
    getShareLinkFromModal: courseCode =>
      getCourseShareLinkFromModal(courseCode, getCurrentSemester(state)),
  };
};

const CourseModalBodyContainer = connect(
  mapStateToProps,
  {
    openSignUpModal,
    fetchCourseInfo,
    hoverSection,
    react,
    saveSettings,
    changeUserInfo,
  },
)(CourseModalBody);

export default CourseModalBodyContainer;

