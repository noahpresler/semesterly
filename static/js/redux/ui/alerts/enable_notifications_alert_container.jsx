import { connect } from 'react-redux';
import { setDeclinedNotifications } from '../../util';
import EnableNotificationsAlert from './enable_notifications_alert';
import * as ActionTypes from '../../constants/actionTypes';

const mapStateToProps = () => ({
  msg: 'Get Alerts!',
});
const mapDispatchToProps = dispatch => ({
  dismissSelf: () => {
    dispatch({ type: ActionTypes.DISMISS_ENABLE_NOTIFICATIONS });
  },
  declineNotifications: () => setDeclinedNotifications(true),
  enableNotifications: () => setDeclinedNotifications(false),
});

const EnableNotificationsAlertContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(EnableNotificationsAlert);
export default EnableNotificationsAlertContainer;
