import { connect } from 'react-redux';
import CourseModalBody from '../../modals/course_modal_body';
import { getActiveTT } from '../../../reducers/root_reducer';
import { hoverSection } from '../../../actions/timetable_actions';
import {
    changeUserInfo,
    fetchCourseInfo,
    openSignUpModal,
    react,
} from '../../../actions/modal_actions';
import { saveSettings } from '../../../actions/user_actions';
import { getSchoolSpecificInfo } from '../../../constants/schools';

const mapStateToProps = (state, ownProps) => {
  let lectureSections = {};
  let tutorialSections = {};
  let practicalSections = {};
  if (state.courseInfo.data.sections) {
    lectureSections = state.courseInfo.data.sections.L;
    tutorialSections = state.courseInfo.data.sections.T;
    practicalSections = state.courseInfo.data.sections.P;
  }
  const courseSections = state.courseSections.objects;
  const activeTimetable = getActiveTT(state);
  return {
    ...ownProps,
    schoolSpecificInfo: getSchoolSpecificInfo(state.school.school),
    isFetching: state.courseInfo.isFetching,
    isFetchingClassmates: state.courseInfo.isFetching,
    classmates: state.courseInfo.classmates,
    lectureSections,
    tutorialSections,
    practicalSections,
    popularityPercent: state.courseInfo.data.popularity_percent * 100,
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

