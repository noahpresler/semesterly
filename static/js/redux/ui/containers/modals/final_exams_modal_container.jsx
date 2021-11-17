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
import FinalExamsModal from '../../modals/final_exams_modal';
import { getActiveTimetable } from '../../../reducers';
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
  const slots = getActiveTimetable(state).slots;
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
    hasNoCourses: !hasFinalExams && slots.length === 0,
    slots,
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
