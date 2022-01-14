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
import { getActiveTimetable } from '../../reducers';
import { setDeclinedNotifications } from '../../util';
import { logFacebookAlertView, saveSettings } from '../../actions/user_actions';
import FriendsInClassAlert from './friends_in_class_alert';
import * as ActionTypes from '../../constants/actionTypes';

const mapStateToProps = (state) => {
  const activeTT = getActiveTimetable(state);
  const msg = `${state.alerts.mostFriendsCount} friends are also taking this class!`;
  return {
    msg,
    mostFriendsClass: activeTT.slots.find(slot =>
      slot.course.id === state.alerts.mostFriendsClassId),
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
