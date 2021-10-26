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
import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import classnames from 'classnames';
import { WaveModal } from 'boron-15';
import majors from '../../constants/majors';
import * as SemesterlyPropTypes from '../../constants/semesterlyPropTypes';
import { isIncomplete as TOSIncomplete } from '../../util';

const UserSettingsModal = (props) => {
  let modal = null;

  // refactor facebook settings to controlled input in order to perform checks and render alert
  const [fbSettings, setfbSettings] = useState({
    shareClassesWithFriends: props.userInfo.social_courses || true,
    shareSectionsWithFriends: props.userInfo.social_offerings || false,
    findNewFriends: props.userInfo.social_all || false,
  });

  const tosAgreed = useRef();

  const [showDelete, setShowDelete] = useState(false);
  const [fbSwitchAlertText, setFbSwitchAlertText] = useState(null);

  const isIncomplete = prop => prop === undefined || prop === '';

  const changeForm = (obj = {}) => {
    const userSettings = { ...props.userInfo, ...obj };
    props.changeUserInfo(userSettings);
    props.saveSettings();
  };

  const handleChangefbSettings = (e) => {
    const name = e.target.name;
    const checked = e.target.checked;
    if (name === 'shareClassesWithFriends') {
      if (!checked && (fbSettings.shareSectionsWithFriends || fbSettings.findNewFriends)) {
        setFbSwitchAlertText('Please switch off "find sections with friends" first');
        setfbSettings({ ...fbSettings, shareClassesWithFriends: true });
      } else {
        setfbSettings({ ...fbSettings, shareClassesWithFriends: checked });
        setFbSwitchAlertText(null);
      }
    } else if (name === 'shareSectionsWithFriends') {
      if (!checked && fbSettings.findNewFriends) {
        setFbSwitchAlertText('Please switch off "find new friends" first');
        setfbSettings({ ...fbSettings, shareSectionsWithFriends: true });
      } else if (checked) {
        setfbSettings(
          {
            ...fbSettings,
            shareClassesWithFriends: true,
            shareSectionsWithFriends: true,
          },
        );
        setFbSwitchAlertText(null);
      } else {
        setfbSettings({ ...fbSettings, shareSectionsWithFriends: false });
        setFbSwitchAlertText(null);
      }
    } else if (name === 'findNewFriends') {
      if (checked) {
        setfbSettings(
          {
            shareClassesWithFriends: true,
            shareSectionsWithFriends: true,
            findNewFriends: true,
          });
      } else {
        setfbSettings({ ...fbSettings, findNewFriends: false });
      }
      setFbSwitchAlertText(null);
    }
  };

  const toggleDelete = () => {
    setShowDelete(!showDelete);
  };

  const changeMajor = (val) => {
    changeForm({ major: val.value });
  };

  const changeClassYear = (val) => {
    changeForm({ class_year: val.value });
  };

  const shouldShow = () =>
    props.userInfo.isLoggedIn &&
    !props.hideOverrided &&
    (props.showOverrided || props.isUserInfoIncomplete);

  const hide = () => {
    if (!props.isUserInfoIncomplete) {
      modal.hide();
      props.setHidden();
      props.closeUserSettings();
      setShowDelete(false);
    }
  };

  const modalStyle = {
    width: '100%',
  };

  useEffect(() => {
    if (isIncomplete(props.userInfo.social_courses)) {
      const newUserSettings = {
        social_courses: true,
        social_offerings: false,
        social_all: false,
      };
      const userSettings = Object.assign({}, props.userInfo, newUserSettings);
      props.changeUserInfo(userSettings);
    }
  }, []);

  useEffect(() => {
    if (props.isDeleted) {
      const link = document.createElement('a');
      link.href = '/user/logout/';
      document.body.appendChild(link);
      link.click();
    }
  }, [props.isDeleted]);

  useEffect(() => {
    if (shouldShow(props)) {
      modal.show();
      props.setVisible();
    }
  }, [props]);

  useEffect(() => {
    const userSettings = {
      ...props.userInfo,
      social_offerings: fbSettings.shareSectionsWithFriends,
      social_courses: fbSettings.shareClassesWithFriends,
      social_all: fbSettings.findNewFriends,
    };
    props.changeUserInfo(userSettings);
    props.saveSettings();
  }, [fbSettings]);

  const tos = props.isSigningUp ? (
    <div className="preference cf">
      <label className="switch switch-slide" htmlFor="tos-agreed-input">
        <input
          ref={tosAgreed}
          id="tos-agreed-input"
          className="switch-input"
          type="checkbox"
          checked={!TOSIncomplete(props.userInfo.timeAcceptedTos)}
          disabled={!TOSIncomplete(props.userInfo.timeAcceptedTos)}
          onChange={() => {
            props.acceptTOS();
            props.changeUserInfo(
              Object.assign({}, props.userInfo, {
                timeAcceptedTos: String(new Date()),
              }),
            );
          }}
        />
        <span
          className="switch-label"
          data-on="ACCEPTED"
          data-off="CLICK TO ACCEPT"
        />
        <span className="switch-handle" />
      </label>
      <div className="preference-wrapper">
        <h3>Accept the terms and conditions</h3>
        <p className="disclaimer">
          By agreeing, you accept our <a>terms and conditions</a> & <a>privacy policy</a>.
        </p>
      </div>
    </div>
  ) : null;

  const preferences = !props.userInfo.FacebookSignedUp ? null : (
    <div>
      <div className="preference cf">
        <label className="switch switch-slide" htmlFor="social-courses-input">
          <input
            name="shareClassesWithFriends"
            id="social-courses-input"
            className="switch-input"
            type="checkbox"
            checked={fbSettings.shareClassesWithFriends}
            onChange={(e) => { handleChangefbSettings(e); }}
          />
          <span className="switch-label" data-on="Yes" data-off="No" />
          <span className="switch-handle" />
        </label>
        <div className="preference-wrapper">
          <h3>Would you like to find classes with friends?</h3>
          <p className="disclaimer">
            See which Facebook friends will be your classmates! Only friends in
            your course will see your name.
          </p>
        </div>
      </div>
      <div className="preference cf">
        <label className="switch switch-slide" htmlFor="share-sections-input">
          <input
            id="share-sections-input"
            name="shareSectionsWithFriends"
            className="switch-input"
            type="checkbox"
            checked={fbSettings.shareSectionsWithFriends}
            onChange={(e) => {
              handleChangefbSettings(e);
            }}
          />
          <span className="switch-label" data-on="Yes" data-off="No" />
          <span className="switch-handle" />
        </label>
        <div className="preference-wrapper">
          <h3>Would you like to find sections with friends?</h3>
          <p className="disclaimer">
            See which Facebook friends will be in your section! Only friends in
            your section will see your name.
          </p>
        </div>
      </div>
      <div className="preference cf">
        <label className="switch switch-slide" htmlFor="social-all-input">
          <input
            name="findNewFriends"
            id="social-all-input"
            className="switch-input"
            type="checkbox"
            checked={fbSettings.findNewFriends}
            onChange={(e) => {
              handleChangefbSettings(e);
            }}
          />
          <span className="switch-label" data-on="Yes" data-off="No" />
          <span className="switch-handle" />
        </label>
        <div className="preference-wrapper">
          <h3>Find new friends in your classes!</h3>
          <p className="disclaimer">
            Find your peers for this semester. All students in your courses will
            be able to view your name and public Facebook profile.
          </p>
        </div>
      </div>
    </div>
  );
  const renderedfbAlert = fbSwitchAlertText ?
    (<div className="alert alert-danger" role="alert">
      {fbSwitchAlertText}
    </div>) : null;

  const fbUpsell =
    props.userInfo.isLoggedIn && !props.userInfo.FacebookSignedUp ? (
      <div
        className={classnames(
          'preference welcome-modal__notifications second cf',
          { 'preference-attn': props.highlightNotifs },
        )}
      >
        <button
          className="btn abnb-btn fb-btn"
          onClick={() => {
            const link = document.createElement('a');
            link.href = `/login/facebook?student_token=${props.userInfo.LoginToken}&login_hash=${props.userInfo.LoginHash}`;
            document.body.appendChild(link);
            link.click();
          }}
        >
          <span className="img-icon">
            <i className="fa fa-facebook" />
          </span>
          <span>Continue with Facebook</span>
        </button>
        <p className="disclaimer ctr">
          Connecting your Facebook allows you to see which of your Facebook
          friends are in your classes! Only friends in your course will see your
          name – your information is never shared with any other party.
        </p>
      </div>
    ) : null;

  const cancelButton = (
    <div className="modal-close" onClick={hide}>
      <i className="fa fa-times" />
    </div>
  );

  const deleteDropdown = showDelete ? (
    <div className="show-delete-dropdown">
      <div className="preference-wrapper">
        <h4 className="delete-btn-text">
          This will delete all timetables and user data!
        </h4>
        <button className="delete-btn" onClick={() => props.deleteUser()}>
          Delete
        </button>
        <button className="delete-btn cancel-delete" onClick={toggleDelete}>
          Cancel
        </button>
      </div>
    </div>
  ) : (
    <h3 className="delete-link" onClick={toggleDelete}>
      Delete my account and all related information{' '}
    </h3>
  );

  return (
    <WaveModal
      ref={(c) => {
        modal = c;
      }}
      className="welcome-modal max-modal"
      closeOnClick={false}
      keyboard={false}
      modalStyle={modalStyle}
    >
      <div className="modal-content">
        <div className="modal-header">
          <div
            className="pro-pic"
            style={{ backgroundImage: `url(${props.userInfo.img_url})` }}
          />
          <h1>Welcome!</h1>
          {!props.isSigningUp ? cancelButton : null}
        </div>
        <div className="modal-body">
          <div className="preference cf">
            {renderedfbAlert}
          </div>
          <div className="preference cf">
            <h3>What&#39;s your major?</h3>
            <Select
              name="form-field-name"
              value={props.userInfo.major}
              options={majors}
              searchable
              onChange={changeMajor}
            />
          </div>
          <div className="preference cf">
            <h3>What&#39;s your graduating class year?</h3>
            <Select
              name="form-field-name"
              value={props.userInfo.class_year}
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
              onChange={changeClassYear}
            />
          </div>
          {preferences}
          {/* { !state.isSigningUp ? notifications : null } */}
          {fbUpsell}
          {tos}
          {!props.isSigningUp ? deleteDropdown : null}
          <div className="button-wrapper">
            <button className="signup-button" onClick={hide}>
              Save
            </button>
          </div>
        </div>
      </div>
    </WaveModal>
  );
};

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
  hideOverrided: PropTypes.bool.isRequired,
  showOverrided: PropTypes.bool.isRequired,
};

export default UserSettingsModal;
