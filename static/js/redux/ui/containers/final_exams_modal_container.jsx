import { connect } from 'react-redux';
import { FinalExamsModal } from '../final_exams_modal.jsx';
import { createiCalfromTimetable, addTTtoGCal } from '../../actions/calendar_actions.jsx';

const mapStateToProps = (state) => {
	return {
		isVisible: state.finalExamsModal.isVisible,
		isDownloading: state.finalExamsModal.isDownloading
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		toggleFinalExamsModal: () => {dispatch({type: "TOGGLE_FINAL_EXAMS_MODAL"})},
		createiCalfromTimetable: () => dispatch(createiCalfromTimetable()),
	}
}

const FinalExamsModalContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(FinalExamsModal);

export default FinalExamsModalContainer;
