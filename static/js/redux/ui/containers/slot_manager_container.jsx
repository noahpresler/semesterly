/**
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
**/

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
      return (typeToLocked !== undefined) && Object.keys(typeToLocked)
          .some(sectionType => (section === typeToLocked[sectionType]));
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
    uses12HrTime: state.ui.uses12HrTime,
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
