import { connect } from 'react-redux';
import Semesterly from '../semesterly.jsx';
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';
import { autoSave, saveTimetable } from '../../actions/user_actions.jsx';

const mapStateToProps = (state) => {
	return {
    	alertConflict: state.alerts.alertConflict,
    	alertTimetableExists: state.alerts.alertTimetableExists,
    	alertChangeSemester: state.alerts.alertChangeSemester,
    	alertNewTimetable: state.alerts.alertNewTimetable,
    	explorationModalIsVisible: state.explorationModal.isVisible,
		PgCount: state.timetables.items.length,
    	PgActive: state.timetables.active,
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		saveTimetable: () => dispatch(saveTimetable()),
		setPgActive: (newActive) => {
			dispatch( {type: "CHANGE_ACTIVE_TIMETABLE", newActive} );
			autoSave();
		},
	}
}

const SemesterlyContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(Semesterly);

export default DragDropContext(HTML5Backend)(SemesterlyContainer);
// export default SemesterlyContainer