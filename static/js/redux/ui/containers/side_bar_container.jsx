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
import SideBar from '../side_bar';
import {
    fetchCourseInfo,
    showFinalExamsModal,
    togglePeerModal,
    triggerTextbookModal,
} from '../../actions/modal_actions';
import {
    addOrRemoveCourse,
    addOrRemoveOptionalCourse,
    loadTimetable,
} from '../../actions/timetable_actions';
import { deleteTimetable, duplicateTimetable } from '../../actions/user_actions';
import { currSem } from '../../reducers/semester_reducer';
import { getCourseShareLink } from '../../constants/endpoints';

const mapStateToProps = (state) => {
  const activeTimetable = state.timetables.items[state.timetables.active];
  const mandatoryCourses = activeTimetable.courses.filter(c => !c.is_optional && !c.fake);
  const optionalCourses = state.optionalCourses.courses;

  return {
    semester: currSem(state.semester),
    semesterIndex: state.semester.current,
    examSupportedSemesters: state.semester.exams,
    // don't want to consider courses that are shown on timetable only
    // because of a 'HOVER_COURSE' action (i.e. fake courses)
    liveTimetableCourses: activeTimetable.courses.filter(c => !c.fake),
    savedTimetables: state.userInfo.data.timetables,
    courseToColourIndex: state.ui.courseToColourIndex,
    classmates: state.classmates.courseToClassmates,
    avgRating: activeTimetable.avg_rating,
    isCourseInRoster: courseId => activeTimetable.courses.some(c => c.id === courseId),
    mandatoryCourses,
    optionalCourses,
    hasLoaded: !state.timetables.isFetching,
    getShareLink: courseCode => getCourseShareLink(courseCode, currSem(state.semester)),
  };
};

const SideBarContainer = connect(
    mapStateToProps,
  {
    fetchCourseInfo,
    removeCourse: addOrRemoveCourse,
    removeOptionalCourse: addOrRemoveOptionalCourse,
    launchPeerModal: togglePeerModal,
    launchTextbookModal: triggerTextbookModal,
    duplicateTimetable,
    deleteTimetable,
    launchFinalExamsModal: showFinalExamsModal,
    loadTimetable,
  },
)(SideBar);

export default SideBarContainer;
