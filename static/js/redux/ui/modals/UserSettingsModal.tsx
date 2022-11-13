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

import React, { useState, useEffect, useRef } from "react";
import { useActions, useAppDispatch, useAppSelector } from "../../hooks";
import Select from "react-select";
import Modal from "./Modal";
import classnames from "classnames";
import majors from "../../constants/majors";
import { isIncomplete as TOSIncomplete } from "../../util";
import { isUserInfoIncomplete as areUserSettingsIncomplete } from "../../state/slices";
import { getIsUserInfoIncomplete } from "../../state";
import { selectTheme } from "../../state/slices/themeSlice";

interface Option {
  value: string;
  label: string;
}

const modalStyle = {
  width: "80%",
  height: "90%",
  maxHeight: "688px",
  maxWidth: "600px",
};

const UserSettingsModal = () => {
  const {
    saveSettings,
    acceptTOS,
    deleteUser,
    overrideSettingsShow,
    changeUserInfo,
    setUserSettingsModalVisible,
    setUserSettingsModalHidden,
  } = useActions();

  const dispatch = useAppDispatch();

  const userInfo = useAppSelector((state) => state.userInfo.data);
  const showOverrided = useAppSelector((state) => state.userInfo.overrideShow);
  const hideOverrided = useAppSelector((state) => state.userInfo.overrideHide);
  const isUserInfoIncomplete = useAppSelector((state) =>
    getIsUserInfoIncomplete(state)
  );
  const highlightNotifs = useAppSelector((state) => state.ui.highlightNotifs);
  const isSigningUp = useAppSelector(
    (state) => !state.userInfo.overrideShow && getIsUserInfoIncomplete(state)
  );
  const isDeleted = useAppSelector((state) => state.userInfo.isDeleted);

  const [fbSettings, setfbSettings] = useState({
    shareClassesWithFriends: userInfo.social_courses || true,
    shareSectionsWithFriends: userInfo.social_offerings || false,
    findNewFriends: userInfo.social_all || false,
  });

  const tosAgreed = useRef();

  const [showDelete, setShowDelete] = useState(false);
  const [fbSwitchAlertText, setFbSwitchAlertText] = useState(null);
  const [userSettings, setUserSettings] = useState({ ...userInfo });

  const isIncomplete = (prop: string | undefined) => prop === undefined || prop === "";

  const handleChangefbSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name;
    const checked = e.target.checked;
    if (name === "shareClassesWithFriends") {
      if (
        !checked &&
        (fbSettings.shareSectionsWithFriends || fbSettings.findNewFriends)
      ) {
        setFbSwitchAlertText('Please switch off "find sections with friends" first');
        setfbSettings({ ...fbSettings, shareClassesWithFriends: true });
      } else {
        setfbSettings({ ...fbSettings, shareClassesWithFriends: checked });
        setFbSwitchAlertText(null);
      }
    } else if (name === "shareSectionsWithFriends") {
      if (!checked && fbSettings.findNewFriends) {
        setFbSwitchAlertText('Please switch off "find new friends" first');
        setfbSettings({ ...fbSettings, shareSectionsWithFriends: true });
      } else if (checked) {
        setfbSettings({
          ...fbSettings,
          shareClassesWithFriends: true,
          shareSectionsWithFriends: true,
        });
        setFbSwitchAlertText(null);
      } else {
        setfbSettings({ ...fbSettings, shareSectionsWithFriends: false });
        setFbSwitchAlertText(null);
      }
    } else if (name === "findNewFriends") {
      if (checked) {
        setfbSettings({
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

  const changeMajor = (majorOption: Option) => {
    setUserSettings({ ...userSettings, major: majorOption.value });
  };

  const changeClassYear = (classYearOption: Option) => {
    setUserSettings({ ...userSettings, class_year: classYearOption.value });
  };

  const showUserSettings = () =>
    userInfo.isLoggedIn && !hideOverrided && (showOverrided || isUserInfoIncomplete);

  const hide = () => {
    changeUserInfo(userSettings);
    saveSettings();
    if (!areUserSettingsIncomplete(userSettings)) {
      setUserSettingsModalHidden();
      overrideSettingsShow(false);
      setShowDelete(false);
    }
  };

  useEffect(() => {
    if (isIncomplete(userInfo.social_courses)) {
      const newUserSettings = {
        social_courses: true,
        social_offerings: false,
        social_all: false,
      };
      setUserSettings(Object.assign({}, userInfo, newUserSettings));
    }
  }, []);

  useEffect(() => {
    if (isDeleted) {
      const link = document.createElement("a");
      link.href = "/user/logout/";
      document.body.appendChild(link);
      link.click();
    }
  }, [isDeleted]);

  useEffect(() => {
    if (showUserSettings()) {
      setUserSettingsModalVisible();
    }
  }, [userInfo.isLoggedIn, hideOverrided, showOverrided, isUserInfoIncomplete]);

  useEffect(() => {
    setUserSettings({
      ...userSettings,
      social_offerings: fbSettings.shareSectionsWithFriends,
      social_courses: fbSettings.shareClassesWithFriends,
      social_all: fbSettings.findNewFriends,
    });
  }, [fbSettings]);

  const tos = isSigningUp ? (
    <div className="preference cf">
      <label className="switch switch-slide" htmlFor="tos-agreed-input">
        <input
          ref={tosAgreed}
          id="tos-agreed-input"
          className="switch-input"
          type="checkbox"
          checked={!TOSIncomplete(userSettings.timeAcceptedTos)}
          disabled={!TOSIncomplete(userSettings.timeAcceptedTos)}
          onChange={() => {
            acceptTOS();
            setUserSettings({ ...userSettings, timeAcceptedTos: String(new Date()) });
          }}
        />
        <span className="switch-label" data-on="ACCEPTED" data-off="CLICK TO ACCEPT" />
        <span className="switch-handle" />
      </label>
      <div className="preference-wrapper">
        <h3>Accept the terms and conditions</h3>
        <p className="disclaimer">
          By agreeing, you accept our
          <a>terms and conditions</a>&<a>privacy policy</a>.
        </p>
      </div>
    </div>
  ) : null;

  const preferences = !userInfo.FacebookSignedUp ? null : (
    <div>
      <div className="preference-row cf">
        <div className="preference-wrapper">
          <h3>Would you like to find classes with friends?</h3>
          <p className="disclaimer">
            See which Facebook friends will be your classmates! Only friends in your
            course will see your name.
          </p>
        </div>
        <label className="switch switch-slide" htmlFor="social-courses-input">
          <input
            name="shareClassesWithFriends"
            id="social-courses-input"
            className="switch-input"
            type="checkbox"
            checked={fbSettings.shareClassesWithFriends}
            onChange={(e) => {
              handleChangefbSettings(e);
            }}
          />
          <span className="switch-label" data-on="Yes" data-off="No" />
          <span className="switch-handle" />
        </label>
      </div>
      <div className="preference-row cf">
        <div className="preference-wrapper">
          <h3>Would you like to find sections with friends?</h3>
          <p className="disclaimer">
            See which Facebook friends will be in your section! Only friends in your
            section will see your name.
          </p>
        </div>
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
      </div>
      <div className="preference-row cf">
        <div className="preference-wrapper">
          <h3>Find new friends in your classes!</h3>
          <p className="disclaimer">
            Find your peers for this semester. All students in your courses will be able
            to view your name and public Facebook profile.
          </p>
        </div>
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
      </div>
    </div>
  );
  const renderedfbAlert = fbSwitchAlertText ? (
    <div className="alert alert-danger" role="alert">
      {fbSwitchAlertText}
    </div>
  ) : null;

  const fbUpsell =
    userInfo.isLoggedIn && !userInfo.FacebookSignedUp ? (
      <div
        className={classnames(
          "preference user-settings-modal__notifications second cf",
          {
            "preference-attn": highlightNotifs,
          }
        )}
      >
        <button
          className="btn abnb-btn fb-btn"
          onClick={() => {
            const link = document.createElement("a");
            link.href = `/login/facebook?student_token=${userInfo.LoginToken}&login_hash=${userInfo.LoginHash}`;
            document.body.appendChild(link);
            link.click();
          }}
        >
          <span className="img-icon">
            <i className="fa fa-facebook" />
          </span>
          <span>Connect with Facebook</span>
        </button>
        <p className="disclaimer ctr">
          Connecting your Facebook allows you to see which of your Facebook friends are
          in your classes! Only friends in your course will see your name – your
          information is never shared with any other party.
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
        <button className="delete-btn" onClick={() => deleteUser()}>
          Delete
        </button>
        <button className="delete-btn cancel-delete" onClick={toggleDelete}>
          Cancel
        </button>
      </div>
    </div>
  ) : (
    <h3 className="delete-link" onClick={toggleDelete}>
      Delete my account and all related information{" "}
    </h3>
  );

  const greetings = userInfo.preferred_name ? (
    <div className="name-greeting">Welcome, {userInfo.preferred_name}!</div>
  ) : (
    <h1>Welcome!</h1>
  );

  const curTheme = useAppSelector(selectTheme);

  return (
    <Modal
      visible={showUserSettings()}
      onClose={() => {
        dispatch(setUserSettingsModalHidden());
      }}
      animation="door"
      className="user-settings-modal max-modal"
      customStyles={modalStyle}
    >
      <div className="modal-content">
        <div className="modal-header">
          <div
            className="pro-pic"
            style={{ backgroundImage: `url(${userInfo.img_url})` }}
          />
          {greetings}
          {!isSigningUp ? cancelButton : null}
        </div>
        <div className="modal-body">
          <div className="preference cf">{renderedfbAlert}</div>
          <div className="preference cf">
            <h3>What&#39;s your major?</h3>
            <Select
              className="select-field"
              value={{ label: userSettings.major, value: userSettings.major }}
              options={majors}
              menuShouldScrollIntoView={false}
              isSearchable
              onChange={changeMajor}
              theme={(theme) => ({
                ...theme,
                colors: { ...theme.colors, ...curTheme.reactSelectColors },
              })}
            />
          </div>
          <div className="preference cf">
            <h3>What&#39;s your graduating class year?</h3>
            <Select
              className="select-field"
              value={{ label: userSettings.class_year, value: userSettings.class_year }}
              options={[
                { value: 2022, label: 2022 },
                { value: 2023, label: 2023 },
                { value: 2024, label: 2024 },
                { value: 2025, label: 2025 },
                { value: 2026, label: 2026 },
                { value: 2027, label: 2027 },
                { value: 2028, label: 2028 },
              ]}
              menuShouldScrollIntoView={false}
              isSearchable
              onChange={changeClassYear}
              theme={(theme) => ({
                ...theme,
                colors: { ...theme.colors, ...curTheme.reactSelectColors },
              })}
            />
          </div>
          {preferences}
          {fbUpsell}
          {tos}
          {!isSigningUp ? deleteDropdown : null}
          <div className="button-wrapper">
            <button className="signup-button" onClick={hide}>
              Save
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default UserSettingsModal;
