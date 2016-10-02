import React from 'react';
import DayCalendarContainer from './containers/day_calendar_container.jsx';
import CalendarContainer from './containers/calendar_container.jsx';
import AlertBox from './alert_box.jsx';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import ConflictAlertContainer from './alerts/conflict_alert_container.jsx';
import TimetableExistsAlertContainer from './alerts/timetable_exists_alert_container.jsx';
import ChangeSemesterAlertContainer from './alerts/change_semester_alert_container.jsx';
import NewTimetableAlertContainer from './alerts/new_timetable_alert_container.jsx'
import TopBarContainer from './containers/top_bar_container.jsx';
import SideBarContainer from './containers/side_bar_container.jsx';
import UserSettingsModalContainer from './containers/user_settings_modal_container.jsx';
import ExplorationModalContainer from './containers/exploration_modal_container.jsx';
import SignupModalContainer from './containers/signup_modal_container.jsx';
import PreferenceModalContainer from './containers/preference_modal_container.jsx';
import TutModalContainer from './containers/tut_modal_container.jsx';
import PeerModalContainer from './containers/peer_modal_container.jsx';

class Semesterly extends React.Component {
	constructor(props) {
        super(props);
        this.state = { 
            orientation: Math.abs(screen.orientation.angle) === 90 ? 'landscape' : 'portrait'
        };
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
			if (Math.abs(screen.orientation.angle) === 90) {
		        this.setState({orientation: 'landscape'});
			} else {
		        this.setState({orientation: 'portrait'});
  			}
		});
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
		let cal = $(window).width() < 767 && this.state.orientation == 'portrait' ? <DayCalendarContainer /> : <CalendarContainer />;
		return (
			<div id="page-wrapper">
				<TopBarContainer />
				<UserSettingsModalContainer />
				<ExplorationModalContainer />
				<SignupModalContainer />
				<PreferenceModalContainer />
				<TutModalContainer />
				<PeerModalContainer />
				<AlertBox ref={a => this.msg = a} {...this.alertOptions} />
				<div id="all-cols">
					<div id="main-bar">
						{cal}
						<footer className="footer navbar no-print">
							<ul className="nav nav-pills no-print">
								<li role="presentation"><a href="mailto:contact@semester.ly?Subject=Semesterly">Contact us</a></li>
								<li role="presentation"><a target="_blank" href="http://goo.gl/forms/YSltU2YI54PC9sXw1">Feedback</a></li>
								<li role="presentation"><a target="_blank" href="https://www.facebook.com/semesterly/">Facebook</a></li>
								<li><div className="fb-like" data-href="https://www.facebook.com/semesterly/" data-layout="button_count" data-action="like" data-show-faces="true" data-share="false"></div></li>
							</ul>
						</footer>
					</div>
					<SideBarContainer />
				</div>
			</div>);
	}
}

export default Semesterly;


/*
<li className="fb-like" data-href="https://www.facebook.com/semesterly/" data-layout="standard" data-action="like" data-show-faces="true" >
								</li>
*/