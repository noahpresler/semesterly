import { connect } from "react-redux";
import CourseModalBody from "../../modals/course_modal_body";
import { getActiveTimetable, getCurrentSemester } from "../../../state";
import { getSectionTypeToSections } from "../../../state/slices/entitiesSlice";
import { fetchCourseInfo, react } from "../../../actions/modal_actions";
import { saveSettings } from "../../../actions/user_actions";
import { getSchoolSpecificInfo } from "../../../constants/schools";
import {
  getCourseShareLink,
  getCourseShareLinkFromModal,
} from "../../../constants/endpoints";
import { userInfoActions } from "../../../state/slices";
import { timetablesActions } from "../../../state/slices/timetablesSlice";
import { signupModalActions } from "../../../state/slices/signupModalSlice";

const mapStateToProps = (state, ownProps) => {
  const denormCourseInfo = ownProps.data;
  const sectionTypeToSections = getSectionTypeToSections(denormCourseInfo);
  const courseSections = state.courseSections.objects;
  const activeTimetable = getActiveTimetable(state);
  return {
    ...ownProps,
    id: denormCourseInfo.code,
    schoolSpecificInfo: getSchoolSpecificInfo(state.school.school),
    isFetchingClassmates: state.courseInfo.isFetchingClassmates,
    classmates: state.courseInfo.classmates,
    sectionTypeToSections,
    popularityPercent: denormCourseInfo.popularity_percent * 100,
    isLoggedIn: state.userInfo.data.isLoggedIn,
    hasSocial: state.userInfo.data.social_courses,
    userInfo: state.userInfo.data,
    isSectionLocked: (courseId, section) => {
      if (courseSections[courseId] === undefined) {
        return false;
      }
      return Object.keys(courseSections[courseId]).some(
        (type) => courseSections[courseId][type] === section
      );
    },
    isSectionOnActiveTimetable: (courseId, sectionId) =>
      activeTimetable.slots.some(
        (slot) => slot.course === courseId && slot.section === sectionId
      ),
    getShareLink: (courseCode) =>
      getCourseShareLink(courseCode, getCurrentSemester(state)),
    getShareLinkFromModal: (courseCode) =>
      getCourseShareLinkFromModal(courseCode, getCurrentSemester(state)),
  };
};

const CourseModalBodyContainer = connect(mapStateToProps, {
  openSignUpModal: signupModalActions.showSignupModal,
  fetchCourseInfo,
  hoverSection: timetablesActions.hoverSection,
  react,
  saveSettings,
  changeUserInfo: userInfoActions.changeUserInfo,
})(CourseModalBody);

export default CourseModalBodyContainer;
