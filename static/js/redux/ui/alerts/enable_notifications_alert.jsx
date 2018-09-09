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

import PropTypes from 'prop-types';
import React from 'react';
import { setARegistrationToken } from '../../actions/user_actions';
import { setDeclinedNotifications } from '../../util';

class EnableNotificationsAlert extends React.Component {

  componentWillUnmount() {
    if (!(localStorage.getItem('declinedNotifications') === 'true' || localStorage.getItem('declinedNotifications') === 'false')) {
      const date = new Date();
      setDeclinedNotifications(date.getTime());
    }
    this.props.dismissSelf();
  }

  clickEnable() {
    setARegistrationToken();
    setDeclinedNotifications(false);
    this.props.enableNotifications();
    this.props.dismissSelf();
  }

  clickDecline() {
    setDeclinedNotifications(true);
    this.props.declineNotifications();
    this.props.dismissSelf();
  }

  render() {
    return (
      <div className="enable-notification-alert change-semester-alert">
        <h2>{ this.props.msg }</h2>
        <button
          onClick={() => this.clickEnable()}
          className="conflict-alert-btn change-semester-btn"
        >
          Enable Notifications
        </button>
        <small className="alert-extra">
          Enable notifications for a heads up when classes are released and course changes
          occur!
        </small>
        <a className="decline-notifications" onClick={() => this.clickDecline()}>Don&apos;t ask
                    me again.</a>
      </div>);
  }
}

EnableNotificationsAlert.propTypes = {
  dismissSelf: PropTypes.func.isRequired,
  msg: PropTypes.string.isRequired,
  enableNotifications: PropTypes.func.isRequired,
  declineNotifications: PropTypes.func.isRequired,
};

export default EnableNotificationsAlert;

