import { connect } from 'react-redux';
import { FinalExamsModal } from '../final_exams_modal';
import { fetchFinalExamSchedule } from '../../actions/user_actions';
import { logFinalExamView } from '../../util';
import { hideFinalExamsModal, triggerAcquisitionModal } from '../../actions/modal_actions';

const remapCourseDetails = (courses) => {
  const remap = {};
  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    remap[course.id] = {
      name: course.name,
      code: course.code,
    };
  }
  return remap;
};

const mapStateToProps = (state) => {
  const active = state.timetables.active;
  const timetables = state.timetables.items;
  return {
    logFinalExamView,
    isVisible: state.finalExamsModal.isVisible,
    finalExamSchedule: state.finalExamsModal.finalExams,
    hasRecievedSchedule: Boolean(state.finalExamsModal.finalExams),
    loading: state.finalExamsModal.isLoading,
    courseToColourIndex: state.ui.courseToColourIndex,
    courseDetails: remapCourseDetails(timetables[active].courses),
    activeLoadedTimetableName: state.savingTimetable.activeTimetable.name,
    hasNoCourses: timetables[active].courses.length === 0,
    courses: timetables[active].courses,
    loadingCachedTT: state.timetables.loadingCachedTT,
    userInfo: state.userInfo.data,
  };
};

const FinalExamsModalContainer = connect(
    mapStateToProps,
  {
    hideFinalExamsModal,
    fetchFinalExamSchedule,
    launchUserAcquisitionModal: triggerAcquisitionModal,
  },
)(FinalExamsModal);

export default FinalExamsModalContainer;
