import { connect } from 'react-redux';
import { setDeclinedNotifications, getDeclinedNotifications } from '../../util.jsx';
import EnableNotificationsAlert from './enable_notifications_alert.jsx';

const mapStateToProps = (state) => {
	let msg = "Enable Notifications!";
	return {
		msg,
	}
}
const mapDispatchToProps = (dispatch) => {
	return {
    	dismissSelf: () => {
    		if (getDeclinedNotifications() !== true && getDeclinedNotifications() !== false) {
				setDeclinedNotifications((new Date).getTime());
    		}
    		dispatch({type: "DISMISS_ENABLE_NOTIFICATIONS"});
    	},
    	declineNotifications: () => setDeclinedNotifications(true),
    	enableNotifications:() => setDeclinedNotifications(false),
	}
}

const EnableNotificationsAlertContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(EnableNotificationsAlert);
export default EnableNotificationsAlertContainer;
