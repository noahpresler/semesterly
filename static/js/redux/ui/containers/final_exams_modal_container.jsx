import { connect } from 'react-redux';
import { FinalExamsModal } from '../final_exams_modal.jsx';
import { fetchFinalExamSchedule } from '../../actions/user_actions.jsx';

const mapStateToProps = (state) => {
	return {
		isVisible: state.finalExamsModal.isVisible,
		finalExamSchedule: state.finalExamsModal.finalExams,
		hasRecievedSchedule: Boolean(state.finalExamsModal.finalExams),
		loading: state.finalExamsModal.isLoading,
		courseDetails: state.timetables.items[0].courses
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
