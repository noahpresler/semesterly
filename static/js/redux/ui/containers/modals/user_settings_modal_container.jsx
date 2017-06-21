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
import { getIsUserInfoIncomplete } from '../../../reducers/root_reducer';

const mapStateToProps = state => ({
  userInfo: state.userInfo.data,
  showOverrided: state.userInfo.overrideShow,
  hideOverrided: state.userInfo.overrideHide,
  tokenRegistered: state.notificationToken.hasToken,
  highlightNotifs: state.ui.highlightNotifs,
  isUserInfoIncomplete: getIsUserInfoIncomplete(state),
  isSigningUp: !state.userInfo.overrideShow && getIsUserInfoIncomplete(state),
});

const UserSettingsModalContainer = connect(
    mapStateToProps,
  {
    saveSettings,
    closeUserSettings: () => overrideSettingsShow(false),
    changeUserInfo,
    acceptTOS,
    setVisible: setUserSettingsModalVisible,
    setHidden: setUserSettingsModalHidden,
    subscribeToNotifications: setARegistrationToken,
    unsubscribeToNotifications: unRegisterAToken,
  },
)(UserSettingsModal);

export default UserSettingsModalContainer;
