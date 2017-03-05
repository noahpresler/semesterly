import { connect } from 'react-redux';
import { FinalExamsModal } from '../final_exams_modal.jsx';
import { fetchFinalExamSchedule } from '../../actions/user_actions.jsx';

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
		courses: timetables[active].courses
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		hideFinalExamsModal: () => {dispatch({type: "HIDE_FINAL_EXAMS_MODAL"})},
		fetchFinalExamSchedule: () => {dispatch(fetchFinalExamSchedule())}
	}
}

const FinalExamsModalContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(FinalExamsModal);

export default FinalExamsModalContainer;
