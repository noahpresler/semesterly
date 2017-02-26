import { connect } from 'react-redux';
import { FinalExamsModal } from '../final_exams_modal.jsx';
import { fetchFinalExamSchedule } from '../../actions/user_actions.jsx';

const remapCourseDetails = (courses) => {
	let remap = {}
	for (let course in courses) {
		remap[courses[course].id] = {
			"courseName" : courses[course].name,
			"courseCode" : courses[course].code
		}
	}
	return remap
}

const mapStateToProps = (state) => {
	return {
		isVisible: state.finalExamsModal.isVisible,
		finalExamSchedule: state.finalExamsModal.finalExams,
		hasRecievedSchedule: Boolean(state.finalExamsModal.finalExams),
		loading: state.finalExamsModal.isLoading,
		courseDetails: remapCourseDetails(state.timetables.items[0].courses)
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		toggleFinalExamsModal: () => {dispatch({type: "TOGGLE_FINAL_EXAMS_MODAL"})},
		fetchFinalExamSchedule: () => {dispatch(fetchFinalExamSchedule())}
	}
}

const FinalExamsModalContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(FinalExamsModal);

export default FinalExamsModalContainer;
