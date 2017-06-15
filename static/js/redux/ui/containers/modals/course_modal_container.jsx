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
import { getSchoolSpecificInfo } from '../../../constants/schools';
import { getCourseShareLink, getCourseShareLinkFromModal } from '../../../constants/endpoints';
import { currSem } from '../../../reducers/semester_reducer';

const mapStateToProps = (state) => {
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
    schoolSpecificInfo: getSchoolSpecificInfo(state.school.school),
    isFetching: state.courseInfo.isFetching,
    isFetchingClassmates: state.courseInfo.isFetching,
    data: state.courseInfo.data,
    classmates: state.courseInfo.classmates,
    id: state.courseInfo.id,
    lectureSections,
    tutorialSections,
    practicalSections,
    hasHoveredResult: activeTimetable.courses.some(course => course.fake),
    prerequisites: state.courseInfo.data.prerequisites,
    description: state.courseInfo.data.description,
    popularityPercent: state.courseInfo.data.popularity_percent * 100,
    inRoster: courseSections[state.courseInfo.id] !== undefined,
    isLoggedIn: state.userInfo.data.isLoggedIn,
    hasSocial: state.userInfo.data.social_courses && state.userInfo.data.social_offerings,
    userInfo: state.userInfo.data,
    getShareLink: courseCode => getCourseShareLink(courseCode, currSem(state.semester)),
    getShareLinkFromModal: courseCode =>
      getCourseShareLinkFromModal(courseCode, currSem(state.semester)),
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
