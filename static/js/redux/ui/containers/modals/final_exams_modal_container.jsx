import { connect } from 'react-redux';
import FinalExamsModal from '../../modals/final_exams_modal';
import { fetchFinalExamSchedule, getFinalExamShareLink } from '../../../actions/exam_actions';
import { logFinalExamView } from '../../../util';
import { hideFinalExamsModal, triggerAcquisitionModal } from '../../../actions/modal_actions';

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
  const schedule = {};
  Object.keys(finalExams).forEach((cid) => {
    const final = finalExams[cid];
    schedule[cid] = final.time;
  });
  return schedule;
};

const getCourseToColorIdx = (index, finalExams) => {
  const hasFinalExams = finalExams !== null &&
    Object.keys(finalExams).length > 0;
  if (hasFinalExams) {
    const newIndex = {};
    Object.keys(finalExams).forEach((cid, idx) => {
      newIndex[cid] = idx;
    });
    return newIndex;
  }
  return index;
};

const mapStateToProps = (state) => {
  const active = state.timetables.active;
  const timetables = state.timetables.items;
  const hasFinalExams = state.finalExamsModal.finalExams !== null &&
    Object.keys(state.finalExamsModal.finalExams).length > 0;
  return {
    logFinalExamView,
    isShare: state.finalExamsModal.fromShare,
    isVisible: state.finalExamsModal.isVisible,
    finalExamSchedule: hasFinalExams ?
      createSchedule(state.finalExamsModal.finalExams) : {},
    hasRecievedSchedule: Boolean(state.finalExamsModal.finalExams),
    loading: state.finalExamsModal.isLoading,
    courseToColourIndex: getCourseToColorIdx(state.ui.courseToColourIndex,
      state.finalExamsModal.finalExams),
    courseDetails: hasFinalExams ?
      remapCourseDetails(state.finalExamsModal.finalExams) : {},
    activeLoadedTimetableName: state.finalExamsModal.fromShare ?
      'Shared Final Exam Schedule' : state.savingTimetable.activeTimetable.name,
    hasNoCourses: !hasFinalExams &&
      timetables[active].courses.length === 0,
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
