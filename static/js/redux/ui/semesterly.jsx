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
import DayCalendarContainer from './containers/day_calendar_container';
import CalendarContainer from './containers/calendar_container';
import AlertBox from './alert_box';
import ConflictAlertContainer from './alerts/conflict_alert_container';
import TimetableExistsAlertContainer from './alerts/timetable_exists_alert_container';
import ChangeSemesterAlertContainer from './alerts/change_semester_alert_container';
import NewTimetableAlertContainer from './alerts/new_timetable_alert_container';
import EnableNotificationsAlertContainer from './alerts/enable_notifications_alert_container';
import FriendsInClassAlertContainer from './alerts/friends_in_class_alert_container';
import TopBarContainer from './containers/top_bar_container';
import SideBarContainer from './containers/side_bar_container';
import UserSettingsModalContainer from './containers/modals/user_settings_modal_container';
import ExplorationModalContainer from './containers/modals/exploration_modal_container';
import SignupModalContainer from './containers/modals/signup_modal_container';
import PreferenceModalContainer from './containers/modals/preference_modal_container';
import TutModalContainer from './containers/modals/tut_modal_container';
import PeerModalContainer from './containers/modals/peer_modal_container';
import IntegrationModalContainer from './containers/modals/integration_modal_container';
import SaveCalendarModalContainer from './containers/modals/save_calendar_modal_container';
import FinalExamsModalContainer from './containers/modals/final_exams_modal_container';
import UserAcquisitionModalContainer from './containers/modals/user_acquisition_modal_container';
import TermsOfServiceModalContainer from './containers/terms_of_service_modal_container';
import TermsOfServiceBannerContainer from './containers/terms_of_service_banner_container';
import TextbookModalContainer from './containers/modals/textbook_modal_container';


class Semesterly extends React.Component {
  constructor(props) {
    super(props);
    const mql = window.matchMedia('(orientation: portrait)');
    this.state = {
      orientation: !mql.matches ? 'landscape' : 'portrait',
    };
    this.updateOrientation = this.updateOrientation.bind(this);
  }

  componentWillMount() {
    $(document.body).on('keydown', (e) => {
      if (parseInt(e.keyCode, 10) === 39) {
        if (this.props.PgActive + 1 < this.props.PgCount) {
          this.props.setPgActive(this.props.PgActive + 1);
        }
      } else if (parseInt(e.keyCode, 10) === 37) {
        if (this.props.PgActive > 0) {
          this.props.setPgActive(this.props.PgActive - 1);
        }
      }
    });
    $(document.body).bind('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (String.fromCharCode(e.which).toLowerCase()) {
          case 's':
            e.preventDefault();
            this.props.saveTimetable();
            break;
          default:
            break;
        }
      }
    });
    window.addEventListener('orientationchange', () => {
      this.updateOrientation();
    });
    window.addEventListener('resize', () => {
      if (!$('.search-bar__input-wrapper input').is(':focus')) {
        this.updateOrientation();
      }
    });
  }

  componentDidMount() {
    if (this.props.alertEnableNotifications) {
      this.msg.show(<EnableNotificationsAlertContainer />, {
        type: 'info',
        time: 12000,
        additionalClass: 'notification-alert',
        icon: <div className="enable-notifications-alert-icon" />,
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps !== this.props) {
      if (nextProps.alertConflict && !this.props.alertConflict) {
        this.showAlert(<ConflictAlertContainer />, 'info', 10000);
      } else if (nextProps.alertTimetableExists && !this.props.alertTimetableExists) {
        this.showAlert(<TimetableExistsAlertContainer />, 'info', 10000);
      } else if (nextProps.alertChangeSemester && !this.props.alertChangeSemester) {
        this.showAlert(<ChangeSemesterAlertContainer />, 'info', 15000);
      } else if (nextProps.alertNewTimetable && !this.props.alertNewTimetable) {
        this.showAlert(<NewTimetableAlertContainer />, 'info', 12000);
      } else if (nextProps.alertEnableNotifications && !this.props.alertEnableNotifications) {
        this.showAlert(<EnableNotificationsAlertContainer />, 'info', 12000);
      } else if (nextProps.alertFacebookFriends && !this.props.alertFacebookFriends) {
        this.msg.show(<FriendsInClassAlertContainer />, {
          type: 'info',
          time: 25000,
          additionalClass: 'friends-in-class-alert-container',
          icon: <div className="friends-in-class-alert-icon" />,
        });
      } else {
        this.msg.removeAll();
      }
    }
  }

  updateOrientation() {
    let orientation = 'portrait';
    if (window.matchMedia('(orientation: portrait)').matches) {
      orientation = 'portrait';
    }
    if (window.matchMedia('(orientation: landscape)').matches) {
      orientation = 'landscape';
    }
    if (orientation !== this.state.orientation) {
      this.setState({ orientation });
    }
  }

  showAlert(alert, type, delay = 5000) {
    this.msg.show(alert, {
      type,
      time: delay,
    });
  }

  render() {
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const cal = mobile && $(window).width() < 767 && this.state.orientation === 'portrait' ?
      <DayCalendarContainer /> :
      <CalendarContainer />;
    return (
      <div className="page-wrapper">
        <TopBarContainer />
        <UserSettingsModalContainer />
        <ExplorationModalContainer />
        <SignupModalContainer />
        <PreferenceModalContainer />
        <IntegrationModalContainer />
        <TutModalContainer />
        <PeerModalContainer />
        <SaveCalendarModalContainer />
        <FinalExamsModalContainer />
        <UserAcquisitionModalContainer />
        <TermsOfServiceModalContainer />
        <TermsOfServiceBannerContainer />
        <TextbookModalContainer />
        <AlertBox ref={(a) => { this.msg = a; }} {...this.alertOptions} />
        <div className="all-cols">
          <div className="main-bar">
            {cal}
            <footer className="footer navbar no-print">
              <p className="data-last-updated no-print">Data last
                updated: { this.props.dataLastUpdated && this.props.dataLastUpdated.length && this.props.dataLastUpdated !== 'null' ? this.props.dataLastUpdated : null }</p>
              <ul className="nav nav-pills no-print">
                <li className="footer-button" role="presentation"><a href="/termsofservice">Terms</a></li>
                <li className="footer-button" role="presentation"><a href="/privacypolicy">Privacy</a></li>
                <li className="footer-button" role="presentation"><a
                  href="mailto:contact@semester.ly?Subject=Semesterly">Contact us</a></li>
                <li className="footer-button" role="presentation"><a target="_blank" rel="noopener noreferrer"
                  href="http://goo.gl/forms/YSltU2YI54PC9sXw1">Feedback</a></li>
                <li className="footer-button" role="presentation"><a rel="noopener noreferrer" target="_blank"
                  href="https://www.facebook.com/semesterly/">Facebook</a></li>
                <li className="footer-button" role="presentation"><a
                    className="footer-button--github"
                    target="_blank" rel="noopener noreferrer"
                    href="https://github.com/noahpresler/semesterly/"
                  ><i className="fa fa-github"></i>Follow</a>
                </li>
                <li className="footer-button">
                  <div
                    className="fb-like"
                    data-href="https://www.facebook.com/semesterly/"
                    data-layout="button_count"
                    data-action="like"
                    data-show-faces="true"
                    data-share="false"
                  />
                </li>
              </ul>
            </footer>
          </div>
          <SideBarContainer />
        </div>
      </div>);
  }
}

Semesterly.propTypes = {
  dataLastUpdated: PropTypes.string.isRequired,
  PgActive: PropTypes.number.isRequired,
  PgCount: PropTypes.number.isRequired,
  alertChangeSemester: PropTypes.bool.isRequired,
  alertConflict: PropTypes.bool.isRequired,
  alertEnableNotifications: PropTypes.bool.isRequired,
  alertFacebookFriends: PropTypes.bool.isRequired,
  alertNewTimetable: PropTypes.bool.isRequired,
  alertTimetableExists: PropTypes.bool.isRequired,
  saveTimetable: PropTypes.func.isRequired,
  setPgActive: PropTypes.func.isRequired,
};

export default Semesterly;

