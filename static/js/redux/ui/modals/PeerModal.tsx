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

import React, { useEffect } from "react";
import { getActiveTimetableDenormCourses } from "../../state";
import Modal from "./Modal";
import { useActions, useAppDispatch, useAppSelector } from "../../hooks";
import { signupModalActions } from "../../state/slices/signupModalSlice";
import { userInfoActions } from "../../state/slices";
import { peerModalActions } from "../../state/slices/peerModalSlice";
import { selectSlotColorData } from "../../state/slices/themeSlice";

const modalStyle = {
  height: "85%",
  width: "90%",
  maxWidth: "1200px",
};

const keyCircleStyle = {
  backgroundColor: "rgb(128, 128, 128)",
};

const emptyState = (
  <div className="peer-card">
    <div className="peer-card-wrapper upsell cf">
      <h4>Check back later!</h4>
      <p className="description">
        Seems you are the first one here! Add some more classes to your timetable or
        check back later to find peers who have added the same classes as you!
      </p>
    </div>
  </div>
);

const ghostCard = (
  <div className="ghost peer-card">
    <div className="peer-card-wrapper">
      <div className="card-hat">
        <div
          className="peer-pic"
          style={{ backgroundImage: "url(/static/img/blank.jpg)" }}
        />
        <div className="user-info">
          <div className="ghost-name" />
          <button className="view-profile-btn" disabled />
        </div>
      </div>
      <div className="shared-courses">
        <div className="shared-course">
          <div className="course-color-circle" />
          <div className="ghost-course-title" />
        </div>
        <div className="shared-course">
          <div
            className="course-color-circle"
            style={{ backgroundColor: "rgb(92, 204, 242)" }}
          />
          <div className="ghost-course-title" />
        </div>
        <div className="shared-course">
          <div
            className="course-color-circle"
            style={{ backgroundColor: "rgb(83, 233, 151)" }}
          />
          <div className="ghost-course-title" />
        </div>
      </div>
    </div>
  </div>
);

const ghostCards = (
  <div className="peer-card-container">
    {ghostCard}
    {ghostCard}
    {ghostCard}
    {ghostCard}
  </div>
);

const PeerModal = () => {
  const dispatch = useAppDispatch();
  const { fetchFriends, saveSettings } = useActions();

  const userInfo = useAppSelector((state) => state.userInfo.data);
  const courses = useAppSelector((state) => getActiveTimetableDenormCourses(state));
  const courseToColourIndex = useAppSelector((state) => state.ui.courseToColourIndex);
  const peers = useAppSelector((state) => state.friends.peers);
  const isLoading = useAppSelector((state) => state.peerModal.isLoading);
  const isVisible = useAppSelector((state) => state.peerModal.isVisible);
  const slotColorData = useAppSelector(selectSlotColorData);

  useEffect(() => {
    if (isVisible && userInfo.social_all) {
      fetchFriends();
    }
  }, [isVisible]);

  const optInAll = () => {
    const newUserSettings = {
      social_courses: true,
      social_offerings: true,
      social_all: true,
    };
    const userSettings = Object.assign({}, userInfo, newUserSettings);
    dispatch(userInfoActions.changeUserInfo(userSettings));
    saveSettings(() => {
      fetchFriends();
    });
  };

  const optInSignUp = () => {
    // Open signup modal
    dispatch(peerModalActions.togglePeerModal());
    dispatch(signupModalActions.showSignupModal());
  };

  const optInClick = userInfo.isLoggedIn ? optInAll : optInSignUp;

  const sideSlots = courses.map((course) => {
    const professors = Array.from(new Set(course.sections.map((s) => s.instructors)));

    const colourIndex = courseToColourIndex[course.id] || 0;
    return (
      <div
        className="pm-side-bar-slot"
        style={{ backgroundColor: slotColorData[colourIndex].background }}
        key={course.id}
      >
        <div
          className="slot-bar"
          style={{ backgroundColor: slotColorData[colourIndex].border }}
        />
        <div className="master-slot-content">
          <h3>{course.code}</h3>
          <h3>{course.name}</h3>
          <h3>{professors.length === 0 ? "No Professor Listed" : professors}</h3>
        </div>
      </div>
    );
  });

  const proPicStyle = !userInfo.isLoggedIn
    ? { backgroundImage: 'url("/static/img/blank.jpg")' }
    : {
        backgroundImage: `url(https://graph.facebook.com/${userInfo.fbook_uid}/picture?width=700&height=700)`,
      };

  const sideBar = (
    <div className="pm-side-bar">
      <div className="circle-pic" style={proPicStyle} />
      <p>Your Courses</p>
      {sideSlots}
    </div>
  );

  const upsell = (
    <div className="peer-card">
      <div className="peer-card-wrapper upsell cf">
        <h4>Study Buddies, Delivered</h4>
        <p className="description">
          See who your classmates are this semester! Click below to find Semester.ly
          users in your courses, message them, or add them on Facebook!
        </p>
        <div className="disclaimer">
          By accepting this permission, any Semester.ly students in your courses will be
          able to view your name and public Facebook profile.
        </div>
        <button className="lure-accept" onClick={optInClick}>
          Yes, I&#39;m In
        </button>
      </div>
    </div>
  );

  const height =
    peers[0] && peers[0].shared_courses ? peers[0].shared_courses.length * 30 + 95 : 0;
  const peerCards = peers.map((p) => {
    const isFriend = p.is_friend ? (
      <p className="friend-status">
        <i className="fa fa-check" /> Friends
      </p>
    ) : null;
    const sharedCourses = p.shared_courses.map((sc) => {
      const colourIndex = courseToColourIndex[sc.course.id] || 0;
      const inSection = sc.in_section ? <i className="fa fa-check" /> : null;
      return (
        <div className="shared-course" key={String(sc.course.id) + p.profile_url}>
          <div
            className="course-color-circle"
            style={{ backgroundColor: slotColorData[colourIndex].background }}
          >
            {inSection}
          </div>
          <p className="course-title">{`${sc.course.code} - ${sc.course.name}`}</p>
        </div>
      );
    });
    return (
      <div className="peer-card" key={p.profile_url}>
        <div className="peer-card-wrapper" style={{ height }}>
          <div className="card-hat">
            <div
              className="peer-pic"
              style={{ backgroundImage: `url(${p.large_img})` }}
            />
            <div className="user-info">
              <h3>{p.name}</h3>
              <a href={p.profile_url} target="_blank" rel="noopener noreferrer">
                <button className="view-profile-btn">
                  <i className="fa fa-facebook-square" />
                  View Profile
                </button>
              </a>
              {isFriend}
            </div>
          </div>
          <div className="shared-courses">{sharedCourses}</div>
        </div>
      </div>
    );
  });

  const peerCardsContainer = <div className="peer-card-container">{peerCards}</div>;

  const display = !isLoading ? (
    <div className="modal-content">
      {userInfo.social_all ? (
        <>
          <h4>Your Classmates</h4>
          <div className="key">
            <div className="key-entry">
              <div className="course-color-circle" style={keyCircleStyle}>
                <i className="fa fa-check" />
              </div>
              <p>peer is in your class & section</p>
            </div>
            <div className="key-entry">
              <div className="course-color-circle" style={keyCircleStyle} />
              <p>peer is in your class only</p>
            </div>
          </div>
        </>
      ) : null}
      {!userInfo.social_all ? upsell : null}
      {peerCards.length === 0 && userInfo.social_all ? emptyState : null}
      {userInfo.social_all ? peerCardsContainer : null}
      {(!userInfo.social_all || peerCards.length === 0) && ghostCards}
    </div>
  ) : (
    <div className="modal-content">
      <span className="img-icon">
        <div className="loader" />
      </span>
      <div className="pm-header">
        <h4>Your Classmates</h4>
      </div>
    </div>
  );

  return (
    <Modal
      visible={isVisible}
      onClose={() => dispatch(peerModalActions.togglePeerModal())}
      animation="door"
      className="peer-modal"
      customStyles={modalStyle}
    >
      <div className="content-wrapper">
        {sideBar}
        {display}
      </div>
    </Modal>
  );
};

export default PeerModal;
