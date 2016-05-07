import React from 'react';
import classNames from 'classnames';
import SearchBarContainer from './containers/search_bar_container.jsx';
import CourseModalContainer from './containers/course_modal_container.jsx';
import TimetableLoaderContainer from './containers/timetable_loader_container.jsx';

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
	render() {
		let divStyle = {
			backgroundImage: 'url(' + ')',
		};
		return (
		<div id="top-bar">
			<img id="semesterly-logo" src="/static/img/logo2.0.png"/>
			<div id="semesterly-name">Semester.ly</div>
		    <TimetableLoaderContainer />
			<SearchBarContainer />
			<CourseModalContainer />
			<div id="social">
				<div id="social-pro-pic" style={divStyle}></div>
				<h2>Rohan</h2>
				<div id="social-dropdown">
					<div className="tip-border"></div>
					<div className="tip"></div>
					<li>
						<i className="fa fa-sign-out"></i>
						<span>Sign out</span>
					</li>
				</div>
			</div>
			<div id="navicon" onClick={this.toggleSideBar}>
				<span></span>
				<span></span>
				<span></span>
			</div>
		</div>);
	}
}

export default TopBar;
