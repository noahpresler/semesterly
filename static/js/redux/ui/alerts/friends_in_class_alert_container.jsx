import { connect } from 'react-redux';
import { setDeclinedNotifications, getDeclinedNotifications } from '../../util.jsx';
import { fetchClassmates, saveSettings, logFacebookAlertView } from '../../actions/user_actions.jsx'
import FriendsInClassAlert from './friends_in_class_alert.jsx';
import * as ActionTypes from '../../constants/actionTypes.jsx'

const mapStateToProps = (state) => {
	let timetables = state.timetables.items;
	let active = state.timetables.active;
	let active_tt = timetables[active];
	let msg = state.alerts.mostFriendsCount + " friends are also taking this class!";
	return {
		msg,
		active_tt,
		mostFriendsClass: active_tt.courses.filter((c) => c.id == state.alerts.mostFriendsClassId)[0],
		mostFriendsCount: state.alerts.mostFriendsCount,
		mostFriendsKey: state.ui.courseToColourIndex[state.alerts.mostFriendsClassId],
		totalFriendsCount: state.alerts.totalFriendsCount,
		userInfo: state.userInfo.data,
		alertFacebookFriends: state.alerts.alertFacebookFriends 
    	&& state.userInfo.data.FacebookSignedUp 
    	&& (!state.userInfo.data.social_courses || state.alerts.facebookAlertIsOn)
    	&& !state.userInfo.overrideShow 
    	&& state.alerts.mostFriendsCount >= 2
	}
}
const mapDispatchToProps = (dispatch) => {
	return {
    	dismissSelf: () => {
    		dispatch({type: ActionTypes.DISMISS_FACEBOOK_FRIENDS});
    	},
    	showNotification: () => {
    		logFacebookAlertView();
    		dispatch({type: ActionTypes.SHOW_FACEBOOK_ALERT});
    	},
    	declineNotifications: () => setDeclinedNotifications(true),
    	enableNotifications:() => setDeclinedNotifications(false),
    	saveSettings: () => dispatch(saveSettings()),
		changeUserInfo: (info) => dispatch({
			type: ActionTypes.CHANGE_USER_INFO,
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
