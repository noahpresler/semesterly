import React from 'react';
import classNames from 'classnames';
import SearchBarContainer from './containers/search_bar_container.jsx';
import CourseModalContainer from './containers/course_modal_container.jsx';
import TimetableLoaderContainer from './containers/timetable_loader_container.jsx';
import SocialProfileContainer from './containers/social_profile_container.jsx';

export const expandSideBar = () => {
	$('#main-bar, #side-bar').removeClass('full-cal').addClass('less-cal');
}

export const collapseSideBar = () => {
	$('#main-bar, #side-bar').removeClass('less-cal').addClass('full-cal');
}

class TopBar extends React.Component {
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
		return (
		<div id="print-content" className="print">
			<span id="print-name" className="print">{userInfo.userFirstName + ' ' + userInfo.userLastName}</span>
			<span id="print-major" className="print">{userInfo.major}</span>
		</div>
		);
	}
	render() {
		return (
		<div id="top-bar">
			<img id="semesterly-logo" src="/static/img/logo2.0-32x32.png"/>
			<div id="semesterly-name">Semester.ly</div>
			{this.props.userInfo.isLoggedIn && this.props.userInfo.userFirstName ? this.renderUserForPrint() : null}
			<SearchBarContainer />
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

export default TopBar;
