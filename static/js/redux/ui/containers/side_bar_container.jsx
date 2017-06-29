import { connect } from 'react-redux';
import partition from 'lodash/partition';
import SideBar from '../side_bar';
import { getActiveDenormTimetable, getCurrentSemester } from '../../reducers/root_reducer';
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
import { getCoursesFromDenormSlots } from '../../reducers/entities_reducer';

// TODO: timeable reducers needs to have its own optionalCourses field with courseIds, since
// getting optionaCourses from slots only get the ones that are actually in the timetable.
// it needs to be more clear that optionalCourses here are ALL optional courses, and livetimetable
// courses are the ones IN the timetable (both mandatory and optional)
const mapStateToProps = (state) => {
  const timetable = getActiveDenormTimetable(state);
  const partitioned = partition(timetable.slots, slot => slot.is_optional);
  const [optional, mandatory] = partitioned.map(slots => getCoursesFromDenormSlots(slots));
  return {
    semester: getCurrentSemester(state),
    semesterIndex: state.semester.current,
    examSupportedSemesters: state.semester.exams,
    // don't want to consider courses that are shown on timetable only
    // because of a 'HOVER_COURSE' action (i.e. fake courses)
    allCourses: optional + mandatory,
    savedTimetables: state.userInfo.data.timetables,
    courseToColourIndex: state.ui.courseToColourIndex,
    classmates: state.classmates.courseToClassmates,
    avgRating: timetable.avg_rating,
    isCourseInRoster: courseId => timetable.courses.some(c => c.id === courseId),
    mandatory,
    optional,
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
