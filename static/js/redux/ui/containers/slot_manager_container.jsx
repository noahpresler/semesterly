import { connect } from 'react-redux';
import {
  getActiveDenormTimetable,
  getHoveredSlots,
  getDenormCourseById } from '../../reducers/root_reducer';
import { fetchCourseInfo } from '../../actions/modal_actions';
import {
    addCustomSlot,
    addOrRemoveCourse,
    addOrRemoveOptionalCourse,
    removeCustomSlot,
    updateCustomSlot,
} from '../../actions/timetable_actions';
import { getSchoolSpecificInfo } from '../../constants/schools';
import SlotManager from '../slot_manager';


const mapStateToProps = (state, ownProps) => ({
  slots: getActiveDenormTimetable(state).slots,
  hoveredSlot: getHoveredSlots(state),
  isLocked: (courseId, section) => {
      // check the courseSections state variable, which tells us
      // precisely which courses have which sections locked, if any
    const typeToLocked = state.courseSections.objects[courseId];
    return (typeToLocked !== undefined) && Object.keys(typeToLocked)
          .some(sectionType => (section === typeToLocked[sectionType]));
  },
  isLoggedIn: state.userInfo.data.isLoggedIn,
  socialSections: state.userInfo.data.social_offerings,
  primaryDisplayAttribute: getSchoolSpecificInfo(state.school.school).primaryDisplay,
  courseToColourIndex: state.ui.courseToColourIndex,
  custom: state.customSlots,
  isCourseOptional: cid => state.optionalCourses.courses.some(c => c === cid),
  getOptionalCourseById: cid => getDenormCourseById(state, cid),
  getClassmatesInSection: (courseId, sectionCode) => {
    if (!(courseId in state.classmates.courseToClassmates)) {
      return [];
    }
    const classmatesInCourse = state.classmates.courseToClassmates[courseId];
    return classmatesInCourse.current.filter(cm => cm.sections.find(s => s === sectionCode));
  },
  days: ownProps.days,
  uses12HrTime: state.ui.uses12HrTime,
});

const SlotManagerContainer = connect(
    mapStateToProps,
  {
    fetchCourseInfo,
    addOrRemoveOptionalCourse,
    addOrRemoveCourse,
    removeCustomSlot,
    updateCustomSlot,
    addCustomSlot,
  },
)(SlotManager);

export default SlotManagerContainer;
