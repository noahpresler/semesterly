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

import React from 'react';
import SearchBarContainer from './containers/search_bar_container';
import CourseModalContainer from './containers/modals/course_modal_container';
import TimetableLoaderContainer from './containers/timetable_loader_container';
import SocialProfileContainer from './containers/social_profile_container';
import * as SemesterlyPropTypes from '../constants/semesterlyPropTypes';

export const expandSideBar = () => {
  $('.main-bar, .side-bar').removeClass('full-cal').addClass('less-cal');
};

export const collapseSideBar = () => {
  $('.main-bar, .side-bar').removeClass('less-cal').addClass('full-cal');
};

class TopBar extends React.Component {
  constructor(props) {
    super(props);
    this.sidebar_collapsed = 'neutral';
    this.toggleSideBar = this.toggleSideBar.bind(this);
    this.renderUserForPrint = this.renderUserForPrint.bind(this);
  }

  toggleSideBar() {
    if (this.sidebar_collapsed === 'neutral') {
      const bodyw = $(window).width();
      if (bodyw > 999) {
        collapseSideBar();
        this.sidebar_collapsed = 'open';
      } else {
        expandSideBar();
        this.sidebar_collapsed = 'closed';
      }
    }
    if (this.sidebar_collapsed === 'closed') {
      expandSideBar();
      this.sidebar_collapsed = 'open';
    } else {
      collapseSideBar();
      this.sidebar_collapsed = 'closed';
    }
  }

  renderUserForPrint() {
    const { userInfo } = this.props;
    return (
      <div className="print">
        <img
          alt="Profile"
          className="usr-pic print"
          src={this.props.userInfo.img_url}
        />
        <div className="print-name-major print">
          <span
            className="print-name print"
          >{`${userInfo.userFirstName} ${userInfo.userLastName}`}</span>
          <span className="print-major print">
            {userInfo.major}
            {userInfo.class_year ? `| Class of ${userInfo.class_year}` : null} |
            {`${this.props.currentSemester.name} ${this.props.currentSemester.year}`}
          </span>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="top-bar">
        <a href="/">
          <img
            alt="logo"
            className="semesterly-logo no-print"
            src="/static/img/logo2.0-32x32.png"
          />
        </a>
        <div className="semesterly-name no-print">Semester.ly</div>
        <div className="print-content print">
          {this.props.userInfo.isLoggedIn && this.props.userInfo.userFirstName ?
            this.renderUserForPrint() : null}
          <div className="name-logo print">
            <div className="semesterly-name-print print">Semester.ly</div>
            <img
              alt="print logo"
              className="semesterly-logo-print print"
              src="/static/img/logo2.0-32x32.png"
            />
          </div>
        </div>
        <SearchBarContainer />
        <CourseModalContainer />
        <SocialProfileContainer />
        <TimetableLoaderContainer />
        <div className="navicon" onClick={this.toggleSideBar}>
          <span />
          <span />
          <span />
        </div>
      </div>);
  }
}

TopBar.propTypes = {
  userInfo: SemesterlyPropTypes.userInfo.isRequired,
  currentSemester: SemesterlyPropTypes.semester.isRequired,
};


export default TopBar;
