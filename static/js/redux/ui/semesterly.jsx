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
import UserSettingsModalContainer from './containers/user_settings_modal_container';
import ExplorationModalContainer from './containers/exploration_modal_container';
import SignupModalContainer from './containers/signup_modal_container';
import PreferenceModalContainer from './containers/preference_modal_container';
import TutModalContainer from './containers/tut_modal_container';
import PeerModalContainer from './containers/peer_modal_container';
import IntegrationModalContainer from './containers/integration_modal_container';
import SaveCalendarModalContainer from './containers/save_calendar_modal_container';
import FinalExamsModalContainer from './containers/final_exams_modal_container';
import UserAcquisitionModalContainer from './containers/user_acquisition_modal_container';
import TextbookModalContainer from './containers/textbook_modal_container';

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
        <TextbookModalContainer />
        <AlertBox ref={(a) => { this.msg = a; }} {...this.alertOptions} />
        <div className="all-cols">
          <div className="main-bar">
            {cal}
            <footer className="footer navbar no-print">
              <ul className="nav nav-pills no-print">
                <li className="footer-button" role="presentation"><a
                  href="mailto:contact@semester.ly?Subject=Semesterly"
                >Contact us</a></li>
                <li className="footer-button" role="presentation"><a
                  target="_blank" rel="noopener noreferrer"
                  href="http://goo.gl/forms/YSltU2YI54PC9sXw1"
                >Feedback</a>
                </li>
                <li className="footer-button" role="presentation"><a
                  target="_blank" rel="noopener noreferrer"
                  href="https://www.facebook.com/semesterly/"
                >Facebook</a>
                </li>
                <li className="footer-button">
                  <div
                    className="fb-like"
                    data-href="https://www.facebook.com/semesterly/"
                    data-layout="button_count" data-action="like"
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
  PgActive: React.PropTypes.number.isRequired,
  PgCount: React.PropTypes.number.isRequired,
  alertChangeSemester: React.PropTypes.bool.isRequired,
  alertConflict: React.PropTypes.bool.isRequired,
  alertEnableNotifications: React.PropTypes.bool.isRequired,
  alertFacebookFriends: React.PropTypes.bool.isRequired,
  alertNewTimetable: React.PropTypes.bool.isRequired,
  alertTimetableExists: React.PropTypes.bool.isRequired,
  saveTimetable: React.PropTypes.func.isRequired,
  setPgActive: React.PropTypes.func.isRequired,
};

export default Semesterly;
