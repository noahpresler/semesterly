import { connect } from 'react-redux';
import UserSettingsModal from '../../modals/user_settings_modal';
import {
  acceptTOS, saveSettings, setARegistrationToken,
  unRegisterAToken,
} from '../../../actions/user_actions';
import {
  changeUserInfo, overrideSettingsShow, setUserSettingsModalHidden,
  setUserSettingsModalVisible,
} from '../../../actions/modal_actions';
import { userPreferencesIncomplete } from '../../../reducers/root_reducer';

const mapStateToProps = state => ({
  userInfo: state.userInfo.data,
  showOverrided: state.userInfo.overrideShow,
  hideOverrided: state.userInfo.overrideHide,
  tokenRegistered: state.notificationToken.hasToken,
  highlightNotifs: state.ui.highlightNotifs,
  userPreferencesIncomplete: userPreferencesIncomplete(state),
  signingUp: !state.userInfo.overrideShow && userPreferencesIncomplete(state),
});

const UserSettingsModalContainer = connect(
    mapStateToProps,
  {
    saveSettings,
    acceptTOS,
    closeUserSettings: () => overrideSettingsShow(false),
    changeUserInfo,
    setVisible: setUserSettingsModalVisible,
    setHidden: setUserSettingsModalHidden,
    subscribeToNotifications: setARegistrationToken,
    unsubscribeToNotifications: unRegisterAToken,
  },
)(UserSettingsModal);

export default UserSettingsModalContainer;
