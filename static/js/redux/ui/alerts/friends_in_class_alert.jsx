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

/* eslint-disable react/forbid-prop-types */
import PropTypes from "prop-types";
import React from "react";
import classnames from "classnames";
import { LogFacebookAlertClick } from "../../actions/user_actions";
import MasterSlot from "../MasterSlot";
import COLOUR_DATA from "../../constants/colours";
import { setDeclinedNotifications } from "../../util";

class FriendsInClassAlert extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isComplete: false };
  }

  componentWillMount() {
    this.props.showNotification();
  }

  componentDidUpdate(nextProps) {
    // eslint-disable-next-line react/prop-types
    if (nextProps.showFacebookAlert) {
      this.props.showNotification();
    }
  }

  componentWillUnmount() {
    if (
      !(
        localStorage.getItem("declinedNotifications") === "true" ||
        localStorage.getItem("declinedNotifications") === "false"
      )
    ) {
      const date = new Date();
      setDeclinedNotifications(date.getTime());
    }
    this.props.dismissSelf();
  }

  allowFacebook() {
    LogFacebookAlertClick();

    const newUserSettings = {
      social_courses: true,
      social_offerings: true,
      social_all: false,
    };
    const userSettings = Object.assign({}, this.props.userInfo, newUserSettings);
    this.props.changeUserInfo(userSettings);
    this.props.saveSettings();
    this.setState({ isComplete: true });
    setTimeout(() => {
      this.props.dismissSelf();
    }, 5000);
  }

  render() {
    const maxColourIndex = COLOUR_DATA.length - 1;
    let professors = [];
    if (
      this.props.mostFriendsClass.slots.length === 0 &&
      this.props.mostFriendsClass.oldSlots &&
      this.props.mostFriendsClass.oldSlots.length > 0
    ) {
      professors = [
        ...new Set(this.props.mostFriendsClass.oldSlots.map((s) => s.instructors)),
      ];
    } else {
      professors = [
        ...new Set(this.props.mostFriendsClass.slots.map((s) => s.instructors)),
      ];
    }

    return (
      <div>
        <div
          className={`${
            this.state.isComplete ? "friends-in-class-show" : "friends-in-class-hide"
          } enable-notification-alert friends-in-class-alert`}
        >
          <i className="friends-in-class-done fa fa-check" />
          <small className={"alert-extra"}>
            You can now see your friends in classes! To revert these changes, head to
            Account Settings.
          </small>
        </div>
        <div
          className={classnames({
            "friends-in-class-hide": this.state.isComplete,
            "enable-notification-alert": true,
            "friends-in-class-alert": true,
          })}
        >
          <h2>{this.props.msg}</h2>
          <MasterSlot
            key={this.props.mostFriendsKey}
            course={this.props.mostFriendsClass}
            professors={professors}
            colourIndex={Math.min(this.props.mostFriendsKey, maxColourIndex)}
            onTimetable
            hideCloseButton
            inModal
            fakeFriends={this.props.mostFriendsCount}
            fetchCourseInfo={() => this.fetchCourseInfo(this.props.mostFriendsClass.id)}
            getShareLink={() => null}
          />
          <small className="alert-extra">
            Plus {this.props.totalFriendsCount} more in other classes. Enable the friend
            feature to find out who!
          </small>
          <button
            onClick={() => {
              this.allowFacebook();
            }}
            className="conflict-alert-btn change-semester-btn"
          >
            Find Friends in Classes
          </button>
        </div>
      </div>
    );
  }
}

FriendsInClassAlert.defaultProps = {
  userInfo: {},
};

FriendsInClassAlert.propTypes = {
  dismissSelf: PropTypes.func.isRequired,
  showNotification: PropTypes.func.isRequired,
  changeUserInfo: PropTypes.func.isRequired,
  saveSettings: PropTypes.func.isRequired,
  msg: PropTypes.string.isRequired,
  mostFriendsKey: PropTypes.number.isRequired,
  mostFriendsCount: PropTypes.number.isRequired,
  totalFriendsCount: PropTypes.number.isRequired,
  mostFriendsClass: PropTypes.shape({
    id: PropTypes.number,
    slots: PropTypes.any,
    oldSlots: PropTypes.any,
  }).isRequired,
  userInfo: PropTypes.shape({
    data: PropTypes.shape({
      social_offerings: PropTypes.bool,
      social_courses: PropTypes.bool,
      social_all: PropTypes.bool,
    }),
  }).isRequired,
};

export default FriendsInClassAlert;
