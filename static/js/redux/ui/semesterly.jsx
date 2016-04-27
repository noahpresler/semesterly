import React from 'react';
import CalendarContainer from './containers/calendar_container.jsx';
import AlertBox from './alert_box.jsx';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import ConflictAlertContainer from './alerts/conflict_alert_container.jsx';
import TopBar from './top_bar.jsx';

class Semesterly extends React.Component {
	componentWillReceiveProps(nextProps) {
		if (nextProps != this.props) {
			if (nextProps.alert_conflict) {
				this.showAlert(<ConflictAlertContainer />, 'info', 10000);
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
				<AlertBox ref={a => this.msg = a} {...this.alertOptions} />
				<div id="all-cols">
					<div id="main-bar">
						<CalendarContainer />
					</div>
					<div id="side-bar">
						I am the sidebar
					</div>
				</div>
			</div>);
	}
}

export default Semesterly;
