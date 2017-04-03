import { connect } from 'react-redux';
import { setSemester } from '../../actions/search_actions.jsx'
import ChangeSemesterAlert from './change_semester_alert.jsx';
import * as ActionTypes from '../../constants/actionTypes.jsx'


const mapStateToProps = (state) => {
	let msg = "Switching semesters will clear your current timetable!";
	return {
		desiredSemester: state.alerts.desiredSemester,
		msg,
	}
}
const mapDispatchToProps = (dispatch) => {
	return {
    	dismissSelf: () => dispatch({type: ActionTypes.DISMISS_ALERT_CHANGE_SEMESTER}),
    	setSemester,
	}
}

const ChangeSemesterAlertContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(ChangeSemesterAlert);
export default ChangeSemesterAlertContainer;
