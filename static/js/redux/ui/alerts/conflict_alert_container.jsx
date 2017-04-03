import { connect } from 'react-redux';
import ConflictAlert from './conflict_alert.jsx';
import { addLastAddedCourse } from '../../actions/timetable_actions.jsx';
import * as ActionTypes from '../../constants/actionTypes.jsx'



const mapStateToProps = (state) => {
	return {}
}
const mapDispatchToProps = (dispatch) => {
	
	return {
    	dismissSelf: () => {
    		dispatch({type: ActionTypes.DISMISS_ALERT_CONFLICT})
    		addLastAddedCourse()
    	},
    	turnConflictsOn: () => dispatch({ type: ActionTypes.TOGGLE_CONFLICTS }),
	}
}

const ConflictAlertContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(ConflictAlert);
export default ConflictAlertContainer;
