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
import Select from 'react-select';
import classnames from 'classnames';
import {WaveModal} from 'boron-15';
import majors from '../../constants/majors';
import * as SemesterlyPropTypes from '../../constants/semesterlyPropTypes';
import { isIncomplete } from '../../util';

class UserSettingsModal extends React.Component {

  static isIncomplete(prop) {
    return prop === undefined || prop === '';
  }

  constructor(props) {
    super(props);
    this.state = {
      sw_capable: 'serviceWorker' in navigator,
      isSigningUp: this.props.isSigningUp,
      showDelete: false,
    };
    this.changeForm = this.changeForm.bind(this);
    this.changeMajor = this.changeMajor.bind(this);
    this.changeClassYear = this.changeClassYear.bind(this);
    this.shouldShow = this.shouldShow.bind(this);
    this.hide = this.hide.bind(this);
    this.toggleDelete = this.toggleDelete.bind(this);
  }

  componentDidMount() {
    if (this.shouldShow(this.props)) {
      this.modal.show();
      this.props.setVisible();
    }
    if (UserSettingsModal.isIncomplete(this.props.userInfo.social_courses)) {
      const newUserSettings = {
        social_courses: true,
        social_offerings: false,
        social_all: false,
      };
      const userSettings = Object.assign({}, this.props.userInfo, newUserSettings);
      this.props.changeUserInfo(userSettings);
    }
  }

  componentWillReceiveProps(props) {
    if (this.shouldShow(props)) {
      this.modal.show();
      this.props.setVisible();
    }
  }

  changeForm(obj = {}) {
    let newUserSettings = {};
    if (this.props.userInfo.FacebookSignedUp) {
      newUserSettings = {
        social_courses: this.shareAll.checked || this.shareCourses.checked,
        social_offerings: this.shareAll.checked || this.shareSections.checked,
        social_all: this.shareAll.checked,
      };
    }
    let userSettings = Object.assign({}, this.props.userInfo, newUserSettings);
    userSettings = Object.assign({}, userSettings, obj);
    this.props.changeUserInfo(userSettings);
    this.props.saveSettings();
  }

  toggleDelete() {
    this.setState({ showDelete: !this.state.showDelete });
  }

  changeMajor(val) {
    this.changeForm({ major: val.value });
  }

  changeClassYear(val) {
    this.changeForm({ class_year: val.value });
  }

  shouldShow(props) {
    return props.userInfo.isLoggedIn && (!props.hideOverrided && (
        props.showOverrided ||
        this.props.isUserInfoIncomplete)
      );
  }

  hide() {
    if (!this.props.isUserInfoIncomplete) {
      this.modal.hide();
      this.props.setHidden();
      this.props.closeUserSettings();
      this.setState({ showDelete: false });
    }
  }

  render() {
    const modalStyle = {
      width: '100%',
    };
    const tos = this.state.isSigningUp ? (<div
      className="preference cf"
    >
      <label className="switch switch-slide" htmlFor="tos-agreed-input">
        <input
          ref={(c) => { this.tosAgreed = c; }} id="tos-agreed-input"
          className="switch-input" type="checkbox"
          checked={!isIncomplete(this.props.userInfo.timeAcceptedTos)}
          disabled={!isIncomplete(this.props.userInfo.timeAcceptedTos)}
          onChange={() => {
            this.props.acceptTOS();
            this.props.changeUserInfo(Object.assign(
              {},
              this.props.userInfo,
              { timeAcceptedTos: String(new Date()) },
            ));
          }}
        />
        <span className="switch-label" data-on="ACCEPTED" data-off="CLICK TO ACCEPT" />
        <span className="switch-handle" />
      </label>
      <div className="preference-wrapper">
        <h3>Accept the terms and conditions</h3>
        <p className="disclaimer">
          By agreeing, you accept our <a>terms and conditions</a> & <a>privacy policy</a>.
        </p>
      </div>
    </div>) : null;
    /* const notificationsButton = this.props.tokenRegistered
        ? (<a onClick={this.props.unsubscribeToNotifications}><h3>Turn Off Notifications</h3></a>)
        : (<a onClick={this.props.subscribeToNotifications}><h3>Turn On Notifications</h3></a>);
    const notifications = this.state.sw_capable ? (
      <div
        className={classnames('preference welcome-modal__notifications cf',
          { 'preference-attn': this.props.highlightNotifs })}
      >
        <h4>Notifications</h4>
        {notificationsButton}
      </div>
            ) :
                (<div
                  className={classnames('preference welcome-modal__notifications cf', {
                    'preference-attn-yellow': this.props.highlightNotifs,
                  })}
                >
                  <h3>Use Another Browser To Enable Device Notifications</h3>
                </div>)
        ; */
    const preferences = !this.props.userInfo.FacebookSignedUp ? null : (
      <div>
        <div className="preference cf">
          <label className="switch switch-slide" htmlFor="social-courses-input">
            <input
              ref={(c) => { this.shareCourses = c; }} id="social-courses-input"
              className="switch-input" type="checkbox"
              checked={this.props.userInfo.social_courses} onChange={this.changeForm}
              defaultChecked
            />
            <span className="switch-label" data-on="Yes" data-off="No" />
            <span className="switch-handle" />
          </label>
          <div className="preference-wrapper">
            <h3>Would you like to find classes with friends?</h3>
            <p className="disclaimer">See which Facebook friends will be your
                            classmates! Only friends in
                            your course will see your name.</p>
          </div>
        </div>
        <div className="preference cf">
          <label className="switch switch-slide" htmlFor="share-sections-input">
            <input
              ref={(c) => { this.shareSections = c; }} id="share-sections-input"
              className="switch-input" type="checkbox"
              checked={this.props.userInfo.social_offerings === true}
              onChange={this.changeForm}
            />
            <span className="switch-label" data-on="Yes" data-off="No" />
            <span className="switch-handle" />
          </label>
          <div className="preference-wrapper">
            <h3>Would you like to find sections with friends?</h3>
            <p className="disclaimer">See which Facebook friends will be in your
                            section! Only friends in
                            your section will see your name.</p>
          </div>
        </div>
        <div className="preference cf">
          <label className="switch switch-slide" htmlFor="social-all-input">
            <input
              ref={(c) => { this.shareAll = c; }} id="social-all-input"
              className="switch-input" type="checkbox"
              checked={this.props.userInfo.social_all === true}
              onChange={this.changeForm}
            />
            <span className="switch-label" data-on="Yes" data-off="No" />
            <span className="switch-handle" />
          </label>
          <div className="preference-wrapper">
            <h3>Find new friends in your classes!</h3>
            <p className="disclaimer">Find your peers for this semester. All students in
                            your courses will
                            be able to view your name and public Facebook profile.</p>
          </div>
        </div>
      </div>
        );
    const fbUpsell = this.props.userInfo.isLoggedIn
      && !this.props.userInfo.FacebookSignedUp ? (
        <div
          className={classnames('preference welcome-modal__notifications second cf',
            { 'preference-attn': this.props.highlightNotifs })}
        >
          <button
            className="btn abnb-btn fb-btn" onClick={() => {
              const link = document.createElement('a');
              link.href = `/login/facebook?student_token=${this.props.userInfo.LoginToken}&login_hash=${this.props.userInfo.LoginHash}`;
              document.body.appendChild(link);
              link.click();
            }}
          >
            <span className="img-icon">
              <i className="fa fa-facebook" />
            </span>
            <span>Continue with Facebook</span>
          </button>
          <p className="disclaimer ctr">Connecting your Facebook allows you to see which of
                    your Facebook friends
                    are in your classes! Only friends in your course will see your name – your
                    information is never
                    shared with any other party.</p>
        </div>) : null;
    const cancelButton = (<div
      className="modal-close"
      onClick={this.hide}
    >
      <i className="fa fa-times" />
    </div>
    );
    const deleteDropdown = this.state.showDelete ? (<div
      className="show-delete-dropdown"
    >
      <div className="preference-wrapper">
        <h4 className="delete-btn-text">This will delete all timetables and user data!</h4>
        <button
          className="delete-btn" onClick={() => this.props.deleteUser()}
        > Delete
        </button>
        <button
          className="delete-btn cancel-delete" onClick={this.toggleDelete}
        > Cancel
        </button>
      </div>
    </div>) : (<h3 className="delete-link" onClick={this.toggleDelete}>
      Delete my account and all related information </h3>);
    if (this.props.isDeleted) {
      const link = document.createElement('a');
      link.href = '/user/logout/';
      document.body.appendChild(link);
      link.click();
    }
    return (
      <WaveModal
        ref={(c) => { this.modal = c; }}
        className="welcome-modal max-modal"
        closeOnClick={false}
        keyboard={false}
        modalStyle={modalStyle}
      >
        <div className="modal-content">
          <div className="modal-header">
            <div className="pro-pic" style={{ backgroundImage: `url(${this.props.userInfo.img_url})` }} />
            <h1>Welcome!</h1>
            { !this.state.isSigningUp ? cancelButton : null }
          </div>
          <div className="modal-body">
            <div className="preference cf">
              <h3>What&#39;s your major?</h3>
              <Select
                name="form-field-name"
                value={this.props.userInfo.major}
                options={majors}
                searchable
                onChange={this.changeMajor}
              />
            </div>
            <div className="preference cf">
              <h3>What&#39;s your graduating class year?</h3>
              <Select
                name="form-field-name"
                value={this.props.userInfo.class_year}
                options={[
                                    { value: 2021, label: 2021 },
                                    { value: 2022, label: 2022 },
                                    { value: 2023, label: 2023 },
                                    { value: 2024, label: 2024 },
                                    { value: 2025, label: 2025 },
                                    { value: 2026, label: 2026 },
                                    { value: 2027, label: 2027 },
                ]}
                searchable
                onChange={this.changeClassYear}
              />
            </div>
            { preferences }
            {/* { !this.state.isSigningUp ? notifications : null } */}
            { fbUpsell }
            { tos }
            { !this.state.isSigningUp ? deleteDropdown : null }
            <div className="button-wrapper">
              <button
                className="signup-button" onClick={this.hide}
              >Save
              </button>
            </div>
          </div>
        </div>
      </WaveModal>
    );
  }
}

UserSettingsModal.propTypes = {
  userInfo: SemesterlyPropTypes.userInfo.isRequired,
  closeUserSettings: PropTypes.func.isRequired,
  saveSettings: PropTypes.func.isRequired,
  changeUserInfo: PropTypes.func.isRequired,
  // tokenRegistered: PropTypes.bool.isRequired,
  // unsubscribeToNotifications: PropTypes.func.isRequired,
  // subscribeToNotifications: PropTypes.func.isRequired,
  highlightNotifs: PropTypes.bool.isRequired,
  isUserInfoIncomplete: PropTypes.bool.isRequired,
  isSigningUp: PropTypes.bool.isRequired,
  acceptTOS: PropTypes.func.isRequired,
  setVisible: PropTypes.func.isRequired,
  setHidden: PropTypes.func.isRequired,
  deleteUser: PropTypes.func.isRequired,
  isDeleted: PropTypes.bool.isRequired,
};

export default UserSettingsModal;
