import { connect } from 'react-redux';
import { getActiveTT } from '../../reducers/root_reducer';
import { setDeclinedNotifications } from '../../util';
import { logFacebookAlertView, saveSettings } from '../../actions/user_actions';
import FriendsInClassAlert from './friends_in_class_alert';
import * as ActionTypes from '../../constants/actionTypes';

const mapStateToProps = (state) => {
  const activeTT = getActiveTT(state);
  const msg = `${state.alerts.mostFriendsCount} friends are also taking this class!`;
  return {
    msg,
    activeTT,
    mostFriendsClass: activeTT.courses.filter(c => c.id === state.alerts.mostFriendsClassId)[0],
    mostFriendsCount: state.alerts.mostFriendsCount,
    mostFriendsKey: state.ui.courseToColourIndex[state.alerts.mostFriendsClassId],
    totalFriendsCount: state.alerts.totalFriendsCount,
    userInfo: state.userInfo.data,
    alertFacebookFriends: state.alerts.alertFacebookFriends
        && state.userInfo.data.FacebookSignedUp
        && (!state.userInfo.data.social_courses || state.alerts.facebookAlertIsOn)
        && !state.userInfo.overrideShow
        && state.alerts.mostFriendsCount >= 2,
  };
};
const mapDispatchToProps = dispatch => ({
  dismissSelf: () => {
    dispatch({ type: ActionTypes.DISMISS_FACEBOOK_FRIENDS });
  },
  showNotification: () => {
    logFacebookAlertView();
    dispatch({ type: ActionTypes.SHOW_FACEBOOK_ALERT });
  },
  declineNotifications: () => setDeclinedNotifications(true),
  enableNotifications: () => setDeclinedNotifications(false),
  saveSettings: () => dispatch(saveSettings()),
  changeUserInfo: info => dispatch({
    type: ActionTypes.CHANGE_USER_INFO,
    data: info,
  }),
});

const FriendsInClassAlertContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(FriendsInClassAlert);
export default FriendsInClassAlertContainer;
