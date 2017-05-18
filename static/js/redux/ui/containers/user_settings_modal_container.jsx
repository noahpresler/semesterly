import { connect } from 'react-redux';
import UserSettingsModal from '../user_settings_modal';
import { saveSettings, setARegistrationToken, unRegisterAToken } from '../../actions/user_actions';
import { changeUserInfo, overrideSettingsShow } from '../../actions/modal_actions';

const mapStateToProps = state => ({
  userInfo: state.userInfo.data,
  showOverrided: state.userInfo.overrideShow,
  hideOverrided: state.userInfo.overrideHide,
  tokenRegistered: state.notificationToken.hasToken,
  highlightNotifs: state.ui.highlightNotifs,
});

const UserSettingsModalContainer = connect(
    mapStateToProps,
  {
    saveSettings,
    closeUserSettings: () => overrideSettingsShow(false),
    changeUserInfo,
    subscribeToNotifications: setARegistrationToken,
    unsubscribeToNotifications: unRegisterAToken,
  },
)(UserSettingsModal);

export default UserSettingsModalContainer;
