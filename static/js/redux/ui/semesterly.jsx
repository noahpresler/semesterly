import React from 'react';
import CalendarContainer from './containers/calendar_container.jsx';
import SearchBarContainer from './containers/search_bar_container.jsx';
import CourseModalContainer from './containers/course_modal_container.jsx';
import AlertBox from './alert_box.jsx';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import ConflictAlertContainer from './alerts/conflict_alert_container.jsx';

class Semesterly extends React.Component {
	constructor(props){
		super(props);
		this.sidebar_collapsed = 'neutral';
		this.toggleSideBar = this.toggleSideBar.bind(this);
	}
	componentWillReceiveProps(nextProps) {
		if (nextProps != this.props) {
			if (nextProps.alert_conflict) {
				this.showAlert(<ConflictAlertContainer />, 'info', 7000);
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
	toggleSideBar() {
		if (this.sidebar_collapsed == 'neutral') {
			var bodyw = $(window).width();
			if (bodyw > 999) {
				this.collapseSideBar();
				this.sidebar_collapsed = 'open';
			} else {
				this.expandSideBar();
				this.sidebar_collapsed = 'closed';
			}
		}
		if (this.sidebar_collapsed == 'closed') {
			this.expandSideBar();
			this.sidebar_collapsed = 'open';
		} else {
			this.collapseSideBar();
			this.sidebar_collapsed = 'closed';
		}
	}

	expandSideBar() {
		$('#main-bar, #side-bar').removeClass('full-cal').addClass('less-cal');
	}

	collapseSideBar() {
		$('#main-bar, #side-bar').removeClass('less-cal').addClass('full-cal');
	}

	render() {
		return (
			<div id="page-wrapper">
				<div id="top-bar">
					<div id="semesterly-name">Semester.ly</div>
					<img id="semesterly-logo" src="/static/img/logo2.0.png"/>
					<AlertBox ref={a => this.msg = a} {...this.alertOptions} />
					<SearchBarContainer />
					<CourseModalContainer />
					<div id="navicon" onClick={this.toggleSideBar}>
						<span></span>
						<span></span>
						<span></span>
					</div>
				</div>
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
