import { connect } from 'react-redux';
import Semesterly from '../semesterly.jsx';
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';

const mapStateToProps = (state) => {
	return {
    	alertConflict: state.alerts.alertConflict,
    	alertTimetableExists: state.alerts.alertTimetableExists,
    	alertChangeSemester: state.alerts.alertChangeSemester,
    	explorationModalIsVisible: state.explorationModal.isVisible
	}
}

const SemesterlyContainer = connect(
	mapStateToProps
)(Semesterly);

export default DragDropContext(HTML5Backend)(SemesterlyContainer);
// export default SemesterlyContainer