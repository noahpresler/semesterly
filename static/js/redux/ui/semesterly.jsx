import React from 'react';
import CalendarContainer from './containers/calendar_container.jsx';
import AlertBox from './alert_box.jsx';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import ConflictAlertContainer from './alerts/conflict_alert_container.jsx';
import TimetableExistsAlertContainer from './alerts/timetable_exists_alert_container.jsx';
import ChangeSemesterAlertContainer from './alerts/change_semester_alert_container.jsx'
import TopBar from './top_bar.jsx';
import SideBarContainer from './containers/side_bar_container.jsx';
import UserSettingsModalContainer from './containers/user_settings_modal_container.jsx';
import ExplorationModalContainer from './containers/exploration_modal_container.jsx';
import SignupModalContainer from './containers/signup_modal_container.jsx';
import PreferenceModalContainer from './containers/preference_modal_container.jsx';

class Semesterly extends React.Component {

	componentWillMount() {
		$(document.body).on('keydown', (e) => {
			if(parseInt(e.keyCode) === 39) {if (this.props.PgActive + 1 < this.props.PgCount) {this.props.setPgActive(this.props.PgActive + 1);}}
			else if(parseInt(e.keyCode) === 37) {if (this.props.PgActive > 0) {this.props.setPgActive(this.props.PgActive - 1);}}
		});
		$(document.body).bind('keydown', (e) => {
			if (event.ctrlKey || event.metaKey) {
				switch (String.fromCharCode(event.which).toLowerCase()) {
				case 's':
					event.preventDefault();
					this.props.saveTimetable();
					break;
				}
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
		return (
			<div id="page-wrapper">
				<TopBar />
				<UserSettingsModalContainer />
				<ExplorationModalContainer />
				<SignupModalContainer />
				<PreferenceModalContainer />
				<AlertBox ref={a => this.msg = a} {...this.alertOptions} />
				<div id="all-cols">
					<div id="main-bar">
						<CalendarContainer />
						<footer class="footer navbar">
							<div class="fb-like" data-href="https://www.facebook.com/semesterly/" data-layout="button_count" data-action="like" data-show-faces="true" data-share="false"></div>
							<ul class="nav nav-pills">
								<li role="presentation"><a TARGET="_blank" href="mailto:contact@semester.ly?Subject=Semesterly">Contact us</a></li>
								<li role="presentation"><a TARGET="_blank" href="https://www.facebook.com/semesterly/">Facebook</a></li>
							</ul>
						</footer>
					</div>
					<SideBarContainer />
				</div>
			</div>);
	}
}

export default Semesterly;
