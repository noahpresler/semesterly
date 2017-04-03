import { connect } from 'react-redux';
import { FinalExamsModal } from '../final_exams_modal.jsx';
import { fetchFinalExamSchedule } from '../../actions/user_actions.jsx';
import { logFinalExamView } from '../../actions/calendar_actions.jsx';
import * as ActionTypes from '../../constants/actionTypes.jsx'

const remapCourseDetails = (courses) => {
	let remap = {}
	for (let course in courses) {
		remap[courses[course].id] = {
			"name" : courses[course].name,
			"code" : courses[course].code
		}
	}
	return remap
}

const mapStateToProps = (state) => {
	let active = state.timetables.active
	let timetables = state.timetables.items
	return {
		isVisible: state.finalExamsModal.isVisible,
		finalExamSchedule: state.finalExamsModal.finalExams,
		hasRecievedSchedule: Boolean(state.finalExamsModal.finalExams),
		loading: state.finalExamsModal.isLoading,
		courseToColourIndex: state.ui.courseToColourIndex,
		courseDetails: remapCourseDetails(timetables[active].courses),
		activeLoadedTimetableName: state.savingTimetable.activeTimetable.name,
		hasNoCourses: timetables[active].courses.length == 0,
		courses: timetables[active].courses,
		loadingCachedTT: state.timetables.loadingCachedTT,
		userInfo: state.userInfo.data
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		hideFinalExamsModal: () => {dispatch({type: ActionTypes.HIDE_FINAL_EXAMS_MODAL})},
		fetchFinalExamSchedule: () => {dispatch(fetchFinalExamSchedule())},
		launchUserAcquisitionModal: () => {
			dispatch({type: ActionTypes.TRIGGER_ACQUISITION_MODAL});
		},
		logFinalExamView
	}
}

const FinalExamsModalContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(FinalExamsModal);

export default FinalExamsModalContainer;
