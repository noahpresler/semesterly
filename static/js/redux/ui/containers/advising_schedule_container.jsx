/*
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
*/

import { connect } from 'react-redux';
import AdvisingSchedule from '../advising_schedule';
import {
  getActiveTimetable,
  getCurrentSemester,
  getDenormCourseById,
  getCoursesFromSlots } from '../../reducers/root_reducer';
import {
  fetchCourseInfo,
  showFinalExamsModal,
  togglePeerModal,
  triggerSISImportDataModal,
} from '../../actions/modal_actions';
import {
  addOrRemoveCourse,
  addOrRemoveOptionalCourse,
  loadTimetable,
} from '../../actions/timetable_actions';
import { deleteTimetable, duplicateTimetable } from '../../actions/user_actions';
import { getCourseShareLink } from '../../constants/endpoints';

const mapStateToProps = (state) => {
  const timetable = getActiveTimetable(state);
  const coursesInTimetable = getCoursesFromSlots(state, timetable.slots);
  const mandatoryCourses = getCoursesFromSlots(state, timetable.slots.filter(
    slot => !slot.is_optional));
  const optionalCourses = state.optionalCourses.courses.map(cid => getDenormCourseById(state, cid));
  return {
    semester: getCurrentSemester(state),
    userInfo: state.userInfo.data,
    semesterIndex: state.semester.current,
    examSupportedSemesters: state.semester.exams,
    coursesInTimetable,
    mandatoryCourses,
    optionalCourses,
    savedTimetables: state.userInfo.data.timetables,
    courseToColourIndex: state.ui.courseToColourIndex,
    courseToClassmates: state.classmates.courseToClassmates,
    avgRating: timetable.avg_rating,
    isCourseInRoster: courseId => timetable.slots.some(s => s.course === courseId),
    hasLoaded: !state.timetables.isFetching,
    getShareLink: courseCode => getCourseShareLink(courseCode, getCurrentSemester(state)),
    timetableName: timetable.name,
  };
};

const AdvisingScheduleContainer = connect(
  mapStateToProps,
  {
    fetchCourseInfo,
    removeCourse: addOrRemoveCourse,
    removeOptionalCourse: addOrRemoveOptionalCourse,
    launchPeerModal: togglePeerModal,
    duplicateTimetable,
    deleteTimetable,
    launchFinalExamsModal: showFinalExamsModal,
    loadTimetable,
    triggerSISImportDataModal,
  },
)(AdvisingSchedule);

export default AdvisingScheduleContainer;
