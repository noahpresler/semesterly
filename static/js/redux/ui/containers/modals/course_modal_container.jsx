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
import CourseModal from '../../modals/course_modal';
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
  const activeTimetable = state.timetables.items[state.timetables.active];
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
    hasSocial: state.userInfo.data.social_courses,
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
