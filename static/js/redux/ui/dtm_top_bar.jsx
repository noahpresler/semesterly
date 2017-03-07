import React from 'react';
import classNames from 'classnames';
import CourseModalContainer from './containers/course_modal_container.jsx';
import TimetableLoaderContainer from './containers/timetable_loader_container.jsx';
import SocialProfileContainer from './containers/social_profile_container.jsx';

export const expandSideBar = () => {
	$('#main-bar, #side-bar').removeClass('full-cal').addClass('less-cal');
}

export const collapseSideBar = () => {
	$('#main-bar, #side-bar').removeClass('less-cal').addClass('full-cal');
}

class DTMTopBar extends React.Component {
	constructor(props){
		super(props);
		this.sidebar_collapsed = 'neutral';
		this.toggleSideBar = this.toggleSideBar.bind(this);
		this.renderUserForPrint = this.renderUserForPrint.bind(this);
	}
	toggleSideBar() {
		if (this.sidebar_collapsed == 'neutral') {
			var bodyw = $(window).width();
			if (bodyw > 999) {
				collapseSideBar();
				this.sidebar_collapsed = 'open';
			} else {
				expandSideBar();
				this.sidebar_collapsed = 'closed';
			}
		}
		if (this.sidebar_collapsed == 'closed') {
			expandSideBar();
			this.sidebar_collapsed = 'open';
		} else {
			collapseSideBar();
			this.sidebar_collapsed = 'closed';
		}
	}
	renderUserForPrint() {
		const { userInfo } = this.props;
		let semester = currentSemester == 'F' ? 'Fall 2016' : 'Spring 2017';
		return (
		<div className="print">
			<img className="usr-pic print" src={'https://graph.facebook.com/' + JSON.parse(currentUser).fbook_uid + '/picture?type=normal'}/>
			<div id="print-name-major" className="print">
				<span id="print-name" className="print">{userInfo.userFirstName + ' ' + userInfo.userLastName}</span>
				<span id="print-major" className="print">{userInfo.major} {userInfo.class_year ? '| Class of ' + userInfo.class_year : null} | {semester}</span>
			</div>
		</div>
		);
	}
	render() {
		return (
		<div id="top-bar">
			<img id="semesterly-logo" className="no-print" src="/static/img/logo2.0-32x32.png"/>
			<div id="semesterly-name" className="no-print">Semester.ly</div>
			<div id="print-content" className="print">
				{this.props.userInfo.isLoggedIn && this.props.userInfo.userFirstName ? this.renderUserForPrint() : null}
				<div id="name-logo" className="print">
					<div id="semesterly-name-print" className="print">Semester.ly</div>
					<img id="semesterly-logo-print" className="print" src="/static/img/logo2.0-32x32.png"/>
				</div>
			</div>
			<span className="share-dtm" onClick={this.props.launchShareAvailabilityModal}>Share Availability</span>
			<CourseModalContainer />
			<SocialProfileContainer />
		    <TimetableLoaderContainer />
			<div id="navicon" onClick={this.toggleSideBar}>
				<span></span>
				<span></span>
				<span></span>
			</div>
		</div>);
	}
}

export default DTMTopBar;
