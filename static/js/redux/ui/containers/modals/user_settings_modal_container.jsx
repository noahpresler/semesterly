/*
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
*/

import { connect } from 'react-redux';
import UserSettingsModal from '../../modals/user_settings_modal';
import {
  acceptTOS, saveSettings, setARegistrationToken,
  unRegisterAToken,
  deleteUser,
} from '../../../actions/user_actions';
import {
  changeUserInfo, overrideSettingsShow, setUserSettingsModalHidden,
  setUserSettingsModalVisible, triggerImportSISModal,
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
  isDeleted: state.userInfo.isDeleted,
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
    deleteUser,
    triggerImportSISModal,
  },
)(UserSettingsModal);

export default UserSettingsModalContainer;
