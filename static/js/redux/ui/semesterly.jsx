import React from 'react';
import CalendarContainer from './containers/calendar_container.jsx';
import SearchBarContainer from './containers/search_bar_container.jsx';
import CourseModalContainer from './containers/course_modal_container.jsx';

const Semesterly = () => (
	<div id="page-wrapper">
		<div id="top-bar">
			<SearchBarContainer />
			<CourseModalContainer />
		</div>
		<div id="all-cols">
		  	<div id="main-bar">
				<CalendarContainer />
			</div>
			<div id="side-bar">
				I am the sidebar
			</div>
		</div>
	</div>
);

export default Semesterly;
