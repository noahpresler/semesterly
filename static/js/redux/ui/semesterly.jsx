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

class Semesterly extends React.Component {
	componentWillReceiveProps(nextProps) {
		if (nextProps != this.props) {
			if (nextProps.alertConflict) {
				this.showAlert(<ConflictAlertContainer />, 'info', 10000);
			}
			else if (nextProps.alertTimetableExists) {
				this.showAlert(<TimetableExistsAlertContainer />, 'info', 10000);
			}
			else if (nextProps.alertChangeSemester) {
				this.showAlert(<ChangeSemesterAlertContainer />, 'info', 10000);
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
				<AlertBox ref={a => this.msg = a} {...this.alertOptions} />
				<div id="all-cols">
					<div id="main-bar">
						<CalendarContainer />
					</div>
					<SideBarContainer />
				</div>
			</div>);
	}
}

export default Semesterly;
