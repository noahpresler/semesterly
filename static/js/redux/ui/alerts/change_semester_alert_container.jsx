import { connect } from 'react-redux';
import { handleChangeSemester } from '../../actions/search_actions.jsx'
import ChangeSemesterAlert from './change_semester_alert.jsx';

const mapStateToProps = (state) => {
	let msg = state.userInfo.data.isLoggedIn ? "You haven't saved your current timetable!" : "Switching semesters will clear your current timetable!";
	return {
		msg,
	}
}
const mapDispatchToProps = (dispatch) => {
	return {
    	dismissSelf: () => dispatch({type: "DISMISS_ALERT_CHANGE_SEMESTER"}),
    	handleChangeSemester,
	}
}

const ChangeSemesterAlertContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(ChangeSemesterAlert);
export default ChangeSemesterAlertContainer;
