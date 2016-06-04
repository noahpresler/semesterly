import { connect } from 'react-redux';
import { createNewTimetable } from '../../actions/timetable_actions.jsx'
import NewTimetableAlert from './new_timetable_alert.jsx';

const mapStateToProps = (state) => {
	let msg = "You haven't saved this timetable! Still want to start a new one?";
	return {
		msg,
	}
}
const mapDispatchToProps = (dispatch) => {
	return {
    	dismissSelf: () => dispatch({type: "DISMISS_ALERT_NEW_TIMETABLE"}),
    	createNewTimetable,
	}
}

const NewTimetableAlertContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(NewTimetableAlert);

export default NewTimetableAlertContainer;
