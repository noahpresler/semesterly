import { connect } from 'react-redux';
import { setDeclinedNotifications, getDeclinedNotifications } from '../../util.jsx';
import FriendsInClassAlert from './friends_in_class_alert.jsx';

const mapStateToProps = (state) => {
	let timetables = state.timetables.items;
	let active = state.timetables.active;
	let active_tt = timetables[active];
	let msg = "7 friends are also taking this class!";
	return {
		msg,
		active_tt
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
