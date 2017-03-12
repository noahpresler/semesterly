import React from 'react';
import DayCalendarContainer from './containers/day_calendar_container.jsx';
import CalendarWeeklyContainer from './containers/calendar_weekly_container.jsx';
import AlertBox from './alert_box.jsx';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import ConflictAlertContainer from './alerts/conflict_alert_container.jsx';
import TimetableExistsAlertContainer from './alerts/timetable_exists_alert_container.jsx';
import ChangeSemesterAlertContainer from './alerts/change_semester_alert_container.jsx';
import NewTimetableAlertContainer from './alerts/new_timetable_alert_container.jsx'
import EnableNotificationsAlertContainer from './alerts/enable_notifications_alert_container.jsx'
import DTMTopBarContainer from './containers/dtm_top_bar_container.jsx';
import DTMSideBarContainer from './containers/dtm_side_bar_container.jsx';
import SideBarContainer from './containers/side_bar_container.jsx';
import UserSettingsModalContainer from './containers/user_settings_modal_container.jsx';
import SignupModalContainer from './containers/signup_modal_container.jsx';
import SaveCalendarModalContainer from './containers/save_calendar_modal_container.jsx';
import UserAcquisitionModalContainer from './containers/user_acquisition_modal_container.jsx';

class DTM extends React.Component {
	constructor(props) {
        super(props);
        let mql = window.matchMedia("(orientation: portrait)");
        this.state = { 
            orientation: !mql.matches ? 'landscape' : 'portrait'
        };
        this.updateOrientation = this.updateOrientation.bind(this);
     }

	componentWillMount() {
		$(document.body).on('keydown', (e) => {
			if(parseInt(e.keyCode) === 39) {if (this.props.PgActive + 1 < this.props.PgCount) {this.props.setPgActive(this.props.PgActive + 1);}}
			else if(parseInt(e.keyCode) === 37) {if (this.props.PgActive > 0) {this.props.setPgActive(this.props.PgActive - 1);}}
		});
		$(document.body).bind('keydown', (e) => {
			if (e.ctrlKey || e.metaKey) {
				switch (String.fromCharCode(e.which).toLowerCase()) {
				case 's':
					e.preventDefault();
					this.props.saveTimetable();
					break;
				}
			}
		});
		window.addEventListener('orientationchange', (e) => {
			this.updateOrientation();
		});
		window.addEventListener('resize', (e) => {
			if (!$('#search-bar-input-wrapper input').is(":focus"))
				this.updateOrientation();
		});
	}

	updateOrientation() {
		let orientation = 'portrait'
		if (window.matchMedia("(orientation: portrait)").matches) {
	        orientation = 'portrait';
		} if (window.matchMedia("(orientation: landscape)").matches) {
	        orientation = 'landscape';
		}
		if (orientation != this.state.orientation) {
			this.setState({orientation: orientation});
		}
	}

	componentDidMount() {
		if (this.props.alertEnableNotifications) {
			this.msg.show(<EnableNotificationsAlertContainer />, {
			  type: 'info',
			  time: 12000,
			  additionalClass: 'notification-alert',
			  icon: <div className="enable-notifications-alert-icon"></div>,
			});
		}
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps != this.props) {
			if (nextProps.alertConflict && !this.props.alertConflict) {
				this.showAlert(<ConflictAlertContainer />, 'info', 10000);
			}
			else if (nextProps.alertTimetableExists && !this.props.alertTimetableExists) {
				this.showAlert(<TimetableExistsAlertContainer />, 'info', 10000);
			}
			else if (nextProps.alertChangeSemester && !this.props.alertChangeSemester) {
				this.showAlert(<ChangeSemesterAlertContainer />, 'info', 15000);
			}
			else if (nextProps.alertNewTimetable && !this.props.alertNewTimetable) {
				this.showAlert(<NewTimetableAlertContainer />, 'info', 12000);
			}
			else if (nextProps.alertEnableNotifications && !this.props.alertEnableNotifications) {
				this.showAlert(<EnableNotificationsAlertContainer />, 'info', 12000);
			}
			else {
				this.msg.removeAll();
			}
		}
	}
	showAlert(alert, type, delay=5000){
		this.msg.show(alert, {
		  type: type,
		  time: delay,
		});
	}

	render() {
		let mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
		let cal = mobile && $(window).width() < 767 && this.state.orientation == 'portrait' ? <DayCalendarContainer /> : <CalendarWeeklyContainer />;
		return (
			<div id="page-wrapper" className={ this.props.isModal ? "dtm shade" : "dtm" }>
				<DTMTopBarContainer />
				<UserSettingsModalContainer />
				<SignupModalContainer />
				<SaveCalendarModalContainer />
				<UserAcquisitionModalContainer />
				<AlertBox ref={a => this.msg = a} {...this.alertOptions} />
				<div id="all-cols">
					<div id="main-bar">
						<div id="calendar-shade" onClick={this.props.hideShareAvailabilityModal}></div>
						{cal}
					</div>
					<DTMSideBarContainer />
				</div>
			</div>);
	}
}

export default DTM;


/*
<li className="fb-like" data-href="https://www.facebook.com/semesterly/" data-layout="standard" data-action="like" data-show-faces="true" >
								</li>
*/