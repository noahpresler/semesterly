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
import { WaveModal } from 'boron-15';
import COLOUR_DATA from '../../constants/colours';
import * as SemesterlyPropTypes from '../../constants/semesterlyPropTypes';


class PeerModal extends React.Component {
  constructor(props) {
    super(props);
    this.hide = this.hide.bind(this);
    this.optInAll = this.optInAll.bind(this);
    this.optInSignUp = this.optInSignUp.bind(this);
  }

  componentDidMount() {
    if (this.props.isVisible) {
      this.modal.show();
      if (this.props.userInfo.social_all) {
        this.props.fetchFriends();
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!this.props.isVisible && nextProps.isVisible) {
      this.modal.show();
      if (this.props.userInfo.social_all) {
        this.props.fetchFriends();
      }
    }
  }

  hide() {
    this.modal.hide();
    if (this.props.isVisible) {
      this.props.togglePeerModal();
    }
  }

  optInAll() {
    const newUserSettings = {
      social_courses: true,
      social_offerings: true,
      social_all: true,
    };
    const userSettings = Object.assign({}, this.props.userInfo, newUserSettings);
    this.props.changeUserInfo(userSettings);
    this.props.saveSettings(() => {
      this.props.fetchFriends();
    });
  }

  optInSignUp() {
    this.hide();
    this.props.openSignUpModal();
  }

  render() {
    const modalStyle = {
      width: '100%',
    };
    const sideSlots = this.props.courses.map((course) => {
      const professors = [...new Set(course.sections.map(s => s.instructors))];
      const colourIndex = this.props.courseToColourIndex[course.id] || 0;
      return (
        <div
          className="pm-side-bar-slot"
          style={{ backgroundColor: COLOUR_DATA[colourIndex].background }}
          key={course.id}
        >
          <div
            className="slot-bar"
            style={{ backgroundColor: COLOUR_DATA[colourIndex].border }}
          />
          <div className="master-slot-content">
            <h3>{ course.code }</h3>
            <h3>{ course.name }</h3>
            <h3>{professors.length === 0 ? 'No Professor Listed' : professors}</h3>
          </div>
        </div>);
    });
    const proPicStyle = !this.props.userInfo.isLoggedIn ? { backgroundImage: 'url("/static/img/blank.jpg")' } : { backgroundImage: `url(http://graph.facebook.com/${this.props.userInfo.fbook_uid}/picture?width=700&height=700)` };
    const sideBar =
            (<div className="pm-side-bar">
              <div className="circle-pic" style={proPicStyle} />
              <p>Your Courses</p>
              {sideSlots}
            </div>);
    const emptyState =
            (<div className="peer-card upsell">
              <div className="peer-card-wrapper upsell cf">
                <h4>Check back later!</h4>
                <p className="description">Seems you are the first one here! Add some more
                        classes to your timetable
                        or check back later to find peers who have added the same classes as
                        you!</p>
              </div>
            </div>);
    const optInClick = this.props.userInfo.isLoggedIn ? this.optInAll : this.optInSignUp;
    const upsell =
            (<div className="peer-card upsell">
              <div className="peer-card-wrapper upsell cf">
                <h4>Study Buddies, Delivered</h4>
                <p className="description">
                  See who your classmates are this semester! Click
                  below to find
                  Semester.ly users in your courses, message them, or add them on Facebook!
                  <i>
                    By accepting this permission, any Semester.ly students in your courses
                    will be able to view your name and public Facebook profile.
                  </i>
                </p>
                <button className="lure-accept" onClick={optInClick}>Yes, I&#39;m In</button>
              </div>
            </div>);
    const height = this.props.peers[0] && this.props.peers[0].shared_courses ?
      (this.props.peers[0].shared_courses.length * 30) + 95 : 0;
    const peerCards = this.props.peers.map((p) => {
      const isFriend = p.is_friend ?
        <p className="friend-status"><i className="fa fa-check" /> Friends</p> : null;
      const sharedCourses = p.shared_courses.map((sc) => {
        const colourIndex = this.props.courseToColourIndex[sc.course.id] || 0;
        const inSection = sc.in_section ? <i className="fa fa-check" /> : null;
        return (<div className="shared-course" key={String(sc.course.id) + p.profile_url}>
          <div
            className="course-color-circle"
            style={{ backgroundColor: COLOUR_DATA[colourIndex].background }}
          >{inSection}</div>
          <p className="course-title">{`${sc.course.code} - ${sc.course.name}`}</p>
        </div>);
      });
      return (<div className="peer-card" key={p.profile_url}>
        <div className="peer-card-wrapper" style={{ height }}>
          <div className="card-hat">
            <div className="peer-pic" style={{ backgroundImage: `url(${p.large_img})` }} />
            <div className="user-info">
              <h3>{p.name}</h3>
              <a href={p.profile_url} target="_blank" rel="noopener noreferrer">
                <button className="view-profile-btn"><i
                  className="fa fa-facebook-square"
                />
                  View Profile
                </button>
              </a>
              {isFriend}
            </div>
          </div>
          <div className="shared-courses">
            {sharedCourses}
          </div>
        </div>
      </div>);
    });
    const ghostCard =
            (<div className="ghost peer-card">
              <div className="peer-card-wrapper">
                <div className="card-hat">
                  <div
                    className="peer-pic"
                    style={{ backgroundImage: 'url(/static/img/blank.jpg)' }}
                  />
                  <div className="user-info">
                    <div className="ghost-name">H</div>
                    <button className="view-profile-btn" />
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
                      style={{ backgroundColor: 'rgb(92, 204, 242)' }}
                    />
                    <div className="ghost-course-title" />
                  </div>
                  <div className="shared-course">
                    <div
                      className="course-color-circle"
                      style={{ backgroundColor: 'rgb(83, 233, 151)' }}
                    />
                    <div className="ghost-course-title" />
                  </div>
                </div>
              </div>
            </div>);
    const ghostCards = !this.props.userInfo.social_all || peerCards.length === 0 ?
      <div>{ghostCard}{ghostCard}{ghostCard}{ghostCard}</div> : null;
    const display = (!this.props.isLoading) ?
            (<div className="main-modal-wrapper">
              <div className="pm-header">
                <h4>Your Classmates</h4>
                <div className="key">
                  <div className="key-entry">
                    <div className="course-color-circle" style={{ backgroundColor: '#ddd' }}>
                      <i
                        className="fa fa-check"
                      /></div>
                    <p>peer is in your class & section</p>
                  </div>
                  <div className="key-entry">
                    <div className="course-color-circle" style={{ backgroundColor: '#ddd' }} />
                    <p>peer is in your class only</p>
                  </div>
                </div>
              </div>
              {!this.props.userInfo.social_all ? upsell : null}
              {peerCards.length === 0 && this.props.userInfo.social_all ? emptyState : null}
              {this.props.userInfo.social_all ? peerCards : null}
              {ghostCards}
            </div>) :
            (<div className="main-modal-wrapper">
              <span className="img-icon">
                <div className="loader" />
              </span>
              <div className="pm-header">
                <h4>Your Classmates</h4>
              </div>
            </div>);
    return (
      <WaveModal
        ref={(c) => { this.modal = c; }}
        className="peer-modal"
        onHide={this.hide}
        modalStyle={modalStyle}
      >
        <div className="modal-content">
          <div className="split-modal-wrapper">
            {sideBar}
            {display}
          </div>
        </div>
      </WaveModal>
    );
  }
}

PeerModal.propTypes = {
  userInfo: SemesterlyPropTypes.userInfo.isRequired,
  peers: PropTypes.arrayOf(SemesterlyPropTypes.peer).isRequired,
  courses: PropTypes.arrayOf(SemesterlyPropTypes.denormalizedCourse).isRequired,
  courseToColourIndex: PropTypes.shape({
    '*': PropTypes.number,
  }).isRequired,
  isVisible: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  fetchFriends: PropTypes.func.isRequired,
  saveSettings: PropTypes.func.isRequired,
  changeUserInfo: PropTypes.func.isRequired,
  togglePeerModal: PropTypes.func.isRequired,
  openSignUpModal: PropTypes.func.isRequired,
};

export default PeerModal;

