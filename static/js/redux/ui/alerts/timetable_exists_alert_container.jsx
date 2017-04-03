import { connect } from 'react-redux';
import TimetableExistsAlert from './timetable_exists_alert.jsx';
import * as ActionTypes from '../../constants/actionTypes.jsx'


const mapStateToProps = (state) => {
	return {}
}
const mapDispatchToProps = (dispatch) => {
	return {
    	dismissSelf: () => dispatch({type: ActionTypes.DISMISS_TIMETABLE_EXISTS}),
	}
}

const TimetableExistsAlertContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(TimetableExistsAlert);
export default TimetableExistsAlertContainer;
