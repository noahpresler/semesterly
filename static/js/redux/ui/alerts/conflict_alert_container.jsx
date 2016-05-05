import { connect } from 'react-redux';
import ConflictAlert from './conflict_alert.jsx';

const mapStateToProps = (state) => {
	return {}
}
const mapDispatchToProps = (dispatch) => {
	return {
    	dismissSelf: () => dispatch({type: "DISMISS_ALERT_CONFLICT"}),
    	turnConflictsOn: () => dispatch({ type: "SET_PREFERENCE", key: 'try_with_conflicts', value: true }),
	}
}

const ConflictAlertContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(ConflictAlert);
export default ConflictAlertContainer;
