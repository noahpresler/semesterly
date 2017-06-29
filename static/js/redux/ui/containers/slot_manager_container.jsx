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
  slots: getActiveDenormTimetable(state).slots.concat(getHoveredSlots(state)),
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
  classmates: (id, sec) => {
    const cm = state.classmates.courseToClassmates ? state.classmates.courseToClassmates
        .find(course => course.course_id === id) : [];
    return cm ? cm.classmates.filter(friend => friend.sections &&
        friend.sections.find(s => s === sec) !== undefined) : [];
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
