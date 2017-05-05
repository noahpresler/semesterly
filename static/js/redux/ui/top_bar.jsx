import React from 'react';
import SearchBarContainer from './containers/search_bar_container';
import CourseModalContainer from './containers/course_modal_container';
import TimetableLoaderContainer from './containers/timetable_loader_container';
import SocialProfileContainer from './containers/social_profile_container';
import * as PropTypes from '../constants/propTypes';

export const expandSideBar = () => {
  $('#main-bar, #side-bar').removeClass('full-cal').addClass('less-cal');
};

export const collapseSideBar = () => {
  $('#main-bar, #side-bar').removeClass('less-cal').addClass('full-cal');
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
          src={`https://graph.facebook.com/${JSON.parse(currentUser).fbook_uid}/picture?type=normal`}
        />
        <div id="print-name-major" className="print">
          <span
            id="print-name"
            className="print"
          >{`${userInfo.userFirstName} ${userInfo.userLastName}`}</span>
          <span id="print-major" className="print">
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
      <div id="top-bar">
        <img
          alt="logo" id="semesterly-logo" className="no-print"
          src="/static/img/logo2.0-32x32.png"
        />
        <div id="semesterly-name" className="no-print">Semester.ly</div>
        <div id="print-content" className="print">
          {this.props.userInfo.isLoggedIn && this.props.userInfo.userFirstName ?
            this.renderUserForPrint() : null}
          <div id="name-logo" className="print">
            <div id="semesterly-name-print" className="print">Semester.ly</div>
            <img
              alt="print logo"
              id="semesterly-logo-print" className="print"
              src="/static/img/logo2.0-32x32.png"
            />
          </div>
        </div>
        <SearchBarContainer />
        <CourseModalContainer />
        <SocialProfileContainer />
        <TimetableLoaderContainer />
        <div id="navicon" onClick={this.toggleSideBar}>
          <span />
          <span />
          <span />
        </div>
      </div>);
  }
}

TopBar.propTypes = {
  userInfo: PropTypes.userInfo.isRequired,
  currentSemester: PropTypes.semester.isRequired,
};


export default TopBar;
