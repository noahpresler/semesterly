import { connect } from 'react-redux';
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


const mapStateToProps = (state, ownProps) => {
  const activeTimetable = state.timetables.items[state.timetables.active];
  return {
    timetable: activeTimetable || [],
    isLocked: (courseId, section) => {
            // check the courseSections state variable, which tells us
            // precisely which courses have which sections locked, if any
      const typeToLocked = state.courseSections.objects[courseId];
      for (let i = 0; i < typeToLocked.length; i++) {
        const sectionType = typeToLocked[i];
        if (section === typeToLocked[sectionType]) {
          return true;
        }
      }
            // couldn't find a match, so the course isn't locked for this section
      return false;
    },
    isLoggedIn: state.userInfo.data.isLoggedIn,
    socialSections: state.userInfo.data.social_offerings,
    primaryDisplayAttribute: getSchoolSpecificInfo(state.school.school).primaryDisplay,
    courseToColourIndex: state.ui.courseToColourIndex,
    custom: state.customSlots,
    isCourseOptional: cid => state.optionalCourses.courses.findIndex(c => c.id === cid) > -1,
    getOptionalCourseById: cid => state.optionalCourses.courses.find(c => c.id === cid),
    classmates: (id, sec) => {
      const cm = state.classmates.courseToClassmates ? state.classmates.courseToClassmates
        .find(course => course.course_id === id) : [];
      return cm ? cm.classmates.filter(friend => friend.sections &&
        friend.sections.find(s => s === sec) !== undefined) : [];
    },
    days: ownProps.days,
  };
};

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
