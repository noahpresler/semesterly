import { connect } from 'react-redux';
import { setDeclinedNotifications, getDeclinedNotifications } from '../../util.jsx';
import FriendsInClassAlert from './friends_in_class_alert.jsx';

const mapStateToProps = (state) => {
	let timetables = state.timetables.items;
	let active = state.timetables.active;
	let active_tt = timetables[active];
	let msg = state.alerts.mostFriendsCount + " friends are also taking this class!";
	return {
		msg,
		active_tt,
		//TOASKNOAH: If you delete a course in the timetable, error will pop up in console because that course is passed in
		//Maybe pass in a new course?
		mostFriendsClass: active_tt.courses.filter((c) => c.id == state.alerts.mostFriendsClassId)[0],
		mostFriendsCount: state.alerts.mostFriendsCount,
		mostFriendsKey: state.ui.courseToColourIndex[state.alerts.mostFriendsClassId]
	}
}
const mapDispatchToProps = (dispatch) => {
	return {
    	dismissSelf: () => {
    		dispatch({type: "DISMISS_ENABLE_NOTIFICATIONS"});
    	},
    	declineNotifications: () => setDeclinedNotifications(true),
    	enableNotifications:() => setDeclinedNotifications(false),
	}
}

const FriendsInClassAlertContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(FriendsInClassAlert);
export default FriendsInClassAlertContainer;
