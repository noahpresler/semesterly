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
import MasterSlot from './master_slot';
import CreditTickerContainer from './containers/credit_ticker_container';
import * as SemesterlyPropTypes from '../constants/semesterlyPropTypes';
import {
  getSISVerifiedCourses,
  getSISVerifiedCoursesNoTT,
} from '../constants/endpoints';
import COLOUR_DATA from '../constants/colours';

class CourseListRow extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      course_list: null,
    };
  }

  fetchVerifiedCourses() {
    if (this.props.displayed_semester != null) {
      const semesterName = this.props.displayed_semester.toString().split(' ')[0];
      const semesterYear = this.props.displayed_semester.toString().split(' ')[1];
      // TODO: Change to include selected stuent's JHED vs. userInfo's jhed
      const jhed = (this.props.userInfo.isAdvisor) ? this.props.userInfo.jhed :
        this.props.userInfo.jhed;
      if (this.props.current_semester === this.props.displayed_semester) {
        fetch(getSISVerifiedCourses(semesterName, semesterYear, jhed, this.props.timetableName))
          .then(response => response.json())
          .then((data) => {
            this.setState({ course_list: data.registeredCourses });
          });
      } else {
        fetch(getSISVerifiedCoursesNoTT(semesterName, semesterYear, jhed))
          .then(response => response.json())
          .then((data) => {
            this.setState({ course_list: data.registeredCourses });
          });
      }
    }
  }

  sendSelectedSemester() {
    this.fetchVerifiedCourses();
    if (this.props.displayed_semester !== this.props.selected_semester) {
      this.props.parentParentCallback(this.props.displayed_semester);
    } else {
      this.props.parentParentCallback(null);
    }
  }

  render() {
    const plannedCourseList = (this.state.course_list &&
      this.props.displayed_semester === this.props.selected_semester) ?
      this.state.course_list.map((course, i) => {
        const maxColourIndex = COLOUR_DATA.length - 1;
        const professors = course.sections.map(section => section.instructors);
        return (<MasterSlot
          key={course.id}
          professors={professors}
          colourIndex={Math.min(i, maxColourIndex)}
          classmates={this.props.courseToClassmates[course.id]}
          course={course}
          fetchCourseInfo={() => this.props.fetchCourseInfo(course.id)}
          hideCloseButton
          verified={course.isVerified}
          hoverable={false}
          onTimetable
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

    let courseKey = null;
    if (this.state.course_list) {
      courseKey = (this.props.userInfo.isAdvisor) ? (<div className="empty-state">
        <h3>
          Courses this student is enrolled in on SIS contain a &nbsp;
          <i className="fa fa-check-circle" /> .
        </h3>
      </div>) : (<div className="empty-state">
        <h3>
          Courses you are enrolled in on SIS contain a &nbsp;
          <i className="fa fa-check-circle" /> .
        </h3>
      </div>);
    }

    const courseList = (<div className="course-list-container">
      {/* TODO: Get credit ticker to display correct num credits for non-current semesters */}
      { creditTicker }
      <a>
        <h4 className="as-header">
         Courses
        </h4>
      </a>
      <div className="as-master-slots">
        { plannedCourseList }
        { courseKey }
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
  userInfo: SemesterlyPropTypes.userInfo.isRequired,
  selected_semester: PropTypes.string,
  current_semester: PropTypes.string.isRequired,
  parentParentCallback: PropTypes.func.isRequired,
  courseToClassmates: PropTypes.shape({ '*': SemesterlyPropTypes.classmates }).isRequired,
  fetchCourseInfo: PropTypes.func.isRequired,
  timetableName: PropTypes.string.isRequired,
};

export default CourseListRow;
