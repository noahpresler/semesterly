import { connect } from 'react-redux';
import { setDeclinedNotifications, getDeclinedNotifications } from '../../util.jsx';
import { fetchClassmates, saveSettings } from '../../actions/user_actions.jsx'
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
		mostFriendsKey: state.ui.courseToColourIndex[state.alerts.mostFriendsClassId],
		totalFriendsCount: state.alerts.totalFriendsCount,
		userInfo: state.userInfo.data,
		alertFacebookFriends: state.alerts.alertFacebookFriends 
    	&& state.userInfo.data.FacebookSignedUp 
    	&& (!state.userInfo.data.social_courses || state.alerts.facebookAlertIsOn)
    	&& !state.userInfo.overrideShow 
    	&& state.alerts.mostFriendsCount >= 1
	}
}
const mapDispatchToProps = (dispatch) => {
	return {
    	dismissSelf: () => {
    		dispatch({type: "DISMISS_FACEBOOK_FRIENDS"});
    	},
    	showNotification: () => {
    		dispatch({type: "SHOW_FACEBOOK_ALERT"});
    	},
    	declineNotifications: () => setDeclinedNotifications(true),
    	enableNotifications:() => setDeclinedNotifications(false),
    	saveSettings: () => dispatch(saveSettings()),
		changeUserInfo: (info) => dispatch({
			type: "CHANGE_USER_INFO",
			data: info,
		}),
		fetchClassmates: (c) => dispatch(fetchClassmates(c)),
	}
}

const FriendsInClassAlertContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(FriendsInClassAlert);
export default FriendsInClassAlertContainer;
