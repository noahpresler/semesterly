import { connect } from 'react-redux';
import FinalExamsModal from '../final_exams_modal';
import { fetchFinalExamSchedule, getFinalExamShareLink } from '../../actions/exam_actions';
import { logFinalExamView } from '../../util';
import { hideFinalExamsModal, triggerAcquisitionModal } from '../../actions/modal_actions';

const remapCourseDetails = (finalExams) => {
  const remap = {};
  Object.keys(finalExams).forEach((cid) => {
    const final = finalExams[cid];
    remap[cid] = {
      name: final.name,
      code: final.code,
    };
  });
  return remap;
};

const createSchedule = (finalExams) => {
  const schedule = {}
  Object.keys(finalExams).forEach((cid) => {
    const final = finalExams[cid];
    schedule[cid] = final.time;
  });
}

const mapStateToProps = (state) => {
  const active = state.timetables.active;
  const timetables = state.timetables.items;
  return {
    logFinalExamView,
    isVisible: state.finalExamsModal.isVisible,
    finalExamSchedule: state.finalExamsModal.finalExams ? 
      createSchedule(state.finalExamsModal.finalExams) : null,
    hasRecievedSchedule: Boolean(state.finalExamsModal.finalExams),
    loading: state.finalExamsModal.isLoading,
    courseToColourIndex: state.ui.courseToColourIndex,
    courseDetails:  state.finalExamsModal.finalExams ? 
      remapCourseDetails(state.finalExamsModal.finalExams) : null,
    activeLoadedTimetableName: state.savingTimetable.activeTimetable.name,
    hasNoCourses: timetables[active].courses.length === 0,
    courses: timetables[active].courses,
    loadingCachedTT: state.timetables.loadingCachedTT,
    userInfo: state.userInfo.data,
    shareLink: state.finalExamsModal.link,
  };
};

const FinalExamsModalContainer = connect(
    mapStateToProps,
  {
    hideFinalExamsModal,
    fetchFinalExamSchedule,
    getFinalExamShareLink,
    launchUserAcquisitionModal: triggerAcquisitionModal,
  },
)(FinalExamsModal);

export default FinalExamsModalContainer;
