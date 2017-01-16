import { connect } from 'react-redux';
import { SaveCalendarModal } from '../save_calendar_modal.jsx';

const mapStateToProps = (state) => {
	return {
		isVisible: state.saveCalendarModal.isVisible,
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		toggleSaveCalendarModal: () => {dispatch({type: "TOGGLE_SAVE_CALENDAR_MODAL"})}
	}
}

const SaveCalendarModalContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(SaveCalendarModal);

export default SaveCalendarModalContainer;
