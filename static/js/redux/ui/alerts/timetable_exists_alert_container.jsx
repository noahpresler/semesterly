import { connect } from 'react-redux';
import TimetableExistsAlert from './timetable_exists_alert.jsx';

const mapStateToProps = (state) => {
	return {}
}
const mapDispatchToProps = (dispatch) => {
	return {
    	dismissSelf: () => dispatch({type: "DISMISS_TIMETABLE_EXISTS"}),
	}
}

const TimetableExistsAlertContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(TimetableExistsAlert);
export default TimetableExistsAlertContainer;
