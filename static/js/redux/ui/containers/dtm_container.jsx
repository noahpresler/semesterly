import { connect } from 'react-redux';
import DTM from '../dtm.jsx';
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';
import { autoSave, saveTimetable } from '../../actions/user_actions.jsx';

const mapStateToProps = (state) => {
	return {
    	alertConflict: state.alerts.alertConflict,
    	alertEnableNotifications: state.alerts.alertEnableNotifications,
    	alertTimetableExists: state.alerts.alertTimetableExists,
    	alertChangeSemester: state.alerts.alertChangeSemester,
    	alertNewTimetable: state.alerts.alertNewTimetable,
    	explorationModalIsVisible: state.explorationModal.isVisible,
		PgCount: state.timetables.items.length,
    	PgActive: state.timetables.active,
    	isModal: state.weeklyCalendar.isModal,
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		saveTimetable: () => dispatch(saveTimetable()),
		hideShareAvailabilityModal: () => {dispatch({type: "HIDE_SHARE_AVAILABILITY_MODAL"})},
		setPgActive: (newActive) => {
			dispatch( {type: "CHANGE_ACTIVE_TIMETABLE", newActive} );
			autoSave();
		},
	}
}

const DTMContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(DTM);

export default DragDropContext(HTML5Backend)(DTMContainer);
// export default SemesterlyContainer