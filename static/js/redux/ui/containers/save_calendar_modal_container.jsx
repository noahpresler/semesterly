import { connect } from 'react-redux';
import { SaveCalendarModal } from '../save_calendar_modal.jsx';
import { createiCalfromTimetable, addTTtoGCal } from '../../actions/calendar_actions.jsx';
import * as ActionTypes from '../../constants/actionTypes.jsx'

const mapStateToProps = (state) => {
	return {
		isVisible: state.saveCalendarModal.isVisible,
		isDownloading: state.saveCalendarModal.isDownloading,
		isUploading: state.saveCalendarModal.isUploading,
		hasDownloaded: state.saveCalendarModal.hasDownloaded,
		hasUploaded: state.saveCalendarModal.hasUploaded,
		userInfo: state.userInfo.data,
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		toggleSaveCalendarModal: () => {dispatch({type: ActionTypes.TOGGLE_SAVE_CALENDAR_MODAL})},
		addTTtoGCal: () => dispatch(addTTtoGCal()),
		createiCalfromTimetable: () => dispatch(createiCalfromTimetable()),
	}
}

const SaveCalendarModalContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(SaveCalendarModal);

export default SaveCalendarModalContainer;
