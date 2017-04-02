import { connect } from 'react-redux';
import ConflictAlert from './conflict_alert.jsx';
import { addLastAddedCourse } from '../../actions/timetable_actions.jsx';

const mapStateToProps = (state) => {
	return {}
}
const mapDispatchToProps = (dispatch) => {
	
	return {
    	dismissSelf: () => {
    		dispatch({type: "DISMISS_ALERT_CONFLICT"})
    		addLastAddedCourse()
    	},
    	turnConflictsOn: () => dispatch({ type: "TOGGLE_CONFLICTS" }),
	}
}

const ConflictAlertContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(ConflictAlert);
export default ConflictAlertContainer;
