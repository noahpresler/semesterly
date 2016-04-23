import React from 'react';
import CalendarContainer from './containers/calendar_container.jsx';
import SearchBarContainer from './containers/search_bar_container.jsx';
import CourseModalContainer from './containers/course_modal_container.jsx';

const Semesterly = () => (
  <div>
    <SearchBarContainer />
    <CalendarContainer />
    <CourseModalContainer />
  </div>
);

export default Semesterly;
