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

import PropTypes from 'prop-types';
import ReactTooltip from 'react-tooltip';
import React from 'react';
import CourseListRow from './course_list_row';
import * as SemesterlyPropTypes from '../constants/semesterlyPropTypes';

class AdvisingSchedule extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mock: null,
    };
  }

  render() {
    const SISImportDataModalButton = (
      <div className="cal-btn-wrapper" style={{ display: 'inline', verticalAlign: 'middle' }}>
        <button
          onClick={() => this.props.triggerSISImportDataModal()}
          data-tip
          className="save-timetable add-button"
          data-for="import-data-btn-tooltip"
        >
          <i className="fa fa-upload" />
        </button>
        <ReactTooltip
          id="import-data-btn-tooltip"
          class="tooltip"
          type="dark"
          place="right"
          effect="solid"
        >
          <span>Import SIS Data</span>
        </ReactTooltip>
      </div>
    );
    const courseListRows = (this.props.displayed_semesters !== null) ?
      this.props.displayed_semesters.map(semester =>
        (<CourseListRow
          key={semester}
          parentParentCallback={this.props.parentCallback}
          displayed_semester={semester}
          current_semester={`${this.props.semester.name} ${this.props.semester.year}`}
          selected_semester={this.props.selected_semester}
          coursesInTimetable={this.props.coursesInTimetable}
          courseToClassmates={this.props.courseToClassmates}
          courseToColourIndex={this.props.courseToColourIndex}
          isCourseInRoster={this.props.isCourseInRoster}
          fetchCourseInfo={this.props.fetchCourseInfo}
          timetableName={this.props.timetableName}
          userInfo={this.props.userInfo}
        />),
      ) : <div className="empty-state"><h4><p> No semesters yet! </p></h4></div>;

    return (
      <div className="advising-schedule-inner">
        <div className="advising-schedule-header">
          Course Summary
          &nbsp;&nbsp;&nbsp;
          { SISImportDataModalButton }
        </div>
        { courseListRows }
      </div>
    );
  }
}

AdvisingSchedule.defaultProps = {
  selected_semester: null,
  displayed_semesters: null,
};

AdvisingSchedule.propTypes = {
  userInfo: SemesterlyPropTypes.userInfo.isRequired,
  triggerSISImportDataModal: PropTypes.func.isRequired,
  selected_semester: PropTypes.string,
  displayed_semesters: PropTypes.arrayOf(PropTypes.string),
  coursesInTimetable: PropTypes.arrayOf(SemesterlyPropTypes.denormalizedCourse).isRequired,
  courseToColourIndex: PropTypes.shape({
    id: PropTypes.string,
  }).isRequired,
  courseToClassmates: PropTypes.shape({ '*': SemesterlyPropTypes.classmates }).isRequired,
  parentCallback: PropTypes.func.isRequired,
  isCourseInRoster: PropTypes.func.isRequired,
  fetchCourseInfo: PropTypes.func.isRequired,
  semester: PropTypes.shape({
    name: PropTypes.string.isRequired,
    year: PropTypes.string.isRequired,
  }).isRequired,
  timetableName: PropTypes.string.isRequired,
};

export default AdvisingSchedule;
