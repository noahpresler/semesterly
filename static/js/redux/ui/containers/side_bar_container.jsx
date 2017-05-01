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
