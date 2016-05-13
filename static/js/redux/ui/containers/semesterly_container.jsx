import { connect } from 'react-redux';
import Semesterly from '../semesterly.jsx';

const mapStateToProps = (state) => {
	return {
    	alertConflict: state.alerts.alertConflict,
    	alertTimetableExists: state.alerts.alertTimetableExists,
    	explorationModalIsVisible: state.explorationModal.isVisible
	}
}

const SemesterlyContainer = connect(
	mapStateToProps
)(Semesterly);

export default SemesterlyContainer;
