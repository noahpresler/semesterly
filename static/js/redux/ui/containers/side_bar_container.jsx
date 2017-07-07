import { connect } from 'react-redux';
import SideBar from '../side_bar';
import {
  getActiveTimetable,
  getCurrentSemester,
  getDenormCourseById,
  getCoursesFromSlots } from '../../reducers/root_reducer';
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
import { getCourseShareLink } from '../../constants/endpoints';

// TODO: timeable reducers needs to have its own optionalCourses field with courseIds, since
// getting optionaCourses from slots only get the ones that are actually in the timetable.
// it needs to be more clear that optionalCourses here are ALL optional courses, and livetimetable
// courses are the ones IN the timetable (both mandatory and optional)
const mapStateToProps = (state) => {
  const timetable = getActiveTimetable(state);
  const coursesInTimetable = getCoursesFromSlots(state, timetable.slots);
  const mandatoryCourses = getCoursesFromSlots(state, timetable.slots.filter(
    slot => !slot.is_optional));
  const optionalCourses = state.optionalCourses.courses.map(cid => getDenormCourseById(state, cid));
  return {
    semester: getCurrentSemester(state),
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
