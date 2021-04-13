/*
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
*/

import React from 'react';
import Collapsible from 'react-collapsible';
import PropTypes from 'prop-types';
import { getNextAvailableColour } from '../util';
import MasterSlot from './master_slot';
import CreditTickerContainer from './containers/credit_ticker_container';
import * as SemesterlyPropTypes from '../constants/semesterlyPropTypes';

class CourseListRow extends React.Component {

  sendSelectedSemester() {
    if (this.props.displayed_semester !== this.props.selected_semester) {
      this.props.parentParentCallback(this.props.displayed_semester);
    } else {
      this.props.parentParentCallback(null);
    }
  }

  render() {
  // TODO: We want to grab the courses on the student's timetable
  // Check what is in this variable: console.log(this.props.coursesInTimetable);
    const plannedCourseList = (this.props.coursesInTimetable &&
      this.props.displayed_semester === this.props.current_semester) ?
    this.props.coursesInTimetable.map((course) => {
      const colourIndex = (course.id in this.props.courseToColourIndex) ?
       this.props.courseToColourIndex[course.id] :
       getNextAvailableColour(this.props.courseToColourIndex);
      const professors = course.sections.map(section => section.instructors);
      return (<MasterSlot
        key={course.id}
        professors={professors}
        colourIndex={colourIndex}
        classmates={this.props.courseToClassmates[course.id]}
        onTimetable={this.props.isCourseInRoster(course.id)}
        course={course}
        fetchCourseInfo={() => this.props.fetchCourseInfo(course.id)}
        hideCloseButton
      />);
    }) : (<div className="empty-state">
      <img src="/static/img/emptystates/masterslots.png" alt="No courses added." />
      <h3>Looks like you don&#39;t have any courses yet!</h3>
      <h4>Your selections will appear here along with credits, professors and friends
      in the class</h4>
    </div>);

    const creditTicker = (this.props.displayed_semester === this.props.current_semester) ?
      <CreditTickerContainer /> : null;
  /* TODO: Replace null above with:
   <div className="sb-credits">
    <h3>{Math.abs(this.state.num_credits).toFixed(2)}</h3>
    <h4>credits</h4>
   </div>
    here this.state.num_credits is the number of credits from courses on SIS */

    const courseList = (<div className="course-list-container">
      {/* TODO: Get credit ticker to display correct num credits for non-current semesters */}
      { creditTicker }
      <a>
        <h4 className="as-header">
         Planned Courses
        </h4>
      </a>
      <div className="as-master-slots">
        { plannedCourseList }
      </div>
    </div>);

    const scheduleName = prop => (<div className="as-semester-name-container">
      <div className="as-semester-name">
        {this.props.displayed_semester}
      </div>
      <div className="as-tip-container">
        {prop ? <span className="as-tip up" /> : <span className="as-tip" />}
      </div>
    </div>);

    return (
      <Collapsible
        open={(this.props.displayed_semester === this.props.selected_semester)}
        trigger={scheduleName(true)}
        triggerWhenOpen={scheduleName(false)}
        handleTriggerClick={() => { this.sendSelectedSemester(); }}
      >
        <div>
          { courseList }
        </div>
      </Collapsible>
    );
  }
}

CourseListRow.defaultProps = {
  selected_semester: null,
};

CourseListRow.propTypes = {
  displayed_semester: PropTypes.string.isRequired,
  selected_semester: PropTypes.string,
  current_semester: PropTypes.string.isRequired,
  parentParentCallback: PropTypes.func.isRequired,
  coursesInTimetable: PropTypes.arrayOf(SemesterlyPropTypes.denormalizedCourse).isRequired,
  courseToColourIndex: PropTypes.shape({
    id: PropTypes.string,
  }).isRequired,
  courseToClassmates: PropTypes.shape({ '*': SemesterlyPropTypes.classmates }).isRequired,
  isCourseInRoster: PropTypes.func.isRequired,
  fetchCourseInfo: PropTypes.func.isRequired,
};

export default CourseListRow;
