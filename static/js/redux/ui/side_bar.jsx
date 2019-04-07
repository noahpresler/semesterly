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
import React from 'react';
import classNames from 'classnames';
import ClickOutHandler from 'react-onclickout';
import uniqBy from 'lodash/uniqBy';
import flatMap from 'lodash/flatMap';
import MasterSlot from './master_slot';
import TimetableNameInputContainer from './containers/timetable_name_input_container';
import CreditTickerContainer from './containers/credit_ticker_container';
import Textbook from './textbook';
import * as SemesterlyPropTypes from '../constants/semesterlyPropTypes';
import { getNextAvailableColour } from '../util';
import { getTextbooksFromCourse } from '../reducers/entities_reducer';

class SideBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = { showDropdown: false };
    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.hideDropdown = this.hideDropdown.bind(this);
  }

  hideDropdown() {
    this.setState({ showDropdown: false });
  }

  toggleDropdown() {
    this.setState({ showDropdown: !this.state.showDropdown });
  }

  stopPropagation(callback, event) {
    event.stopPropagation();
    this.hideDropdown();
    callback();
  }

  render() {
    const savedTimetables = this.props.savedTimetables ? this.props.savedTimetables.map(t => (
      <div className="tt-name" key={t.id} onMouseDown={() => this.props.loadTimetable(t)}>
        {t.name}
        <button
          onClick={event => this.stopPropagation(() => this.props.deleteTimetable(t), event)}
          className="row-button"
        >
          <i className="fa fa-trash-o" />
        </button>
        <button
          onClick={event => this.stopPropagation(() => this.props.duplicateTimetable(t), event)}
          className="row-button"
        >
          <i className="fa fa-clone" />
        </button>
      </div>
        )) : null;
    // TOOD: code duplication between masterslots/optionalslots
    let masterSlots = this.props.mandatoryCourses ?
      this.props.mandatoryCourses.map((course) => {
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
          removeCourse={() => this.props.removeCourse(course.id)}
          getShareLink={this.props.getShareLink}
        />);
      }) : null;

    const dropItDown = savedTimetables && savedTimetables.length !== 0 ?
            (<div
              className="timetable-drop-it-down"
              onMouseDown={this.toggleDropdown}
            >
              <span className={classNames('tip-down', { down: this.state.showDropdown })} />
            </div>) : null;
    if (masterSlots.length === 0) {
      masterSlots = (
        <div className="empty-state">
          <img src="/static/img/emptystates/masterslots.png" alt="No courses added." />
          <h4>Looks like you don&#39;t have any courses yet!</h4>
          <h3>Your selections will appear here along with credits, professors and friends
                        in the class</h3>
        </div>);
    }
    const finalScheduleLink = (masterSlots.length > 0 &&
      this.props.examSupportedSemesters.indexOf(this.props.semesterIndex) >= 0
      && this.props.hasLoaded) ?
            (<div
              className="final-schedule-link"
              onClick={this.props.launchFinalExamsModal}
            >
              <i className="fa fa-calendar" aria-hidden="true" />
                See Finals Schedule
            </div>)
            : null;
    return (
      <div className="side-bar no-print">
        <div className="sb-name">
          <TimetableNameInputContainer />
          <ClickOutHandler onClickOut={this.hideDropdown}>
            {dropItDown}
            <div
              className={classNames('timetable-names-dropdown', { down: this.state.showDropdown })}
            >
              <div className="tip-border" />
              <div className="tip" />
              <h4>{ `${this.props.semester.name} ${this.props.semester.year}` }</h4>
              { savedTimetables }
            </div>
          </ClickOutHandler>
        </div>
        <CreditTickerContainer />
        <div className="col-2-3 sb-rating">
          <h3>Average Course Rating</h3>
          <div className="sub-rating-wrapper">
            <div className="star-ratings-sprite">
              <span
                style={{ width: `${(100 * this.props.avgRating) / 5}%` }}
                className="rating"
              />
            </div>
          </div>
        </div>
        <a onClick={this.props.launchPeerModal}>
          <h4 className="sb-header">
            Current Courses
            <div className="sb-header-link">
              <i className="fa fa-users" />&nbsp;Find new friends
            </div>
          </h4>
        </a>
        <h4 className="sb-tip">
          <b>ProTip:</b> use <i className="fa fa-lock" />
          to lock a section in place.
        </h4>
        <div className="sb-master-slots">
          { masterSlots }
          { finalScheduleLink }
        </div>
        <div className="empty-state">
          <h4 style={{ fontSize: 18 }}>Class registration is here!</h4>
          <h4>Click the shield to add your classes to SIS!</h4>
          <h3>Current Freshman: Fri 6/12
          <br />Current Sophomores: Wed 6/10
          <br />Current Juniors: Mon 6/8</h3>
        </div>
      </div>
    );
  }
}

// TODO: should be these values by default in the state
SideBar.defaultProps = {
  savedTimetables: null,
  avgRating: 0,
};

SideBar.propTypes = {
  savedTimetables: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
  })),
  mandatoryCourses: PropTypes.arrayOf(SemesterlyPropTypes.denormalizedCourse).isRequired,
  courseToColourIndex: PropTypes.shape({
    id: PropTypes.string,
  }).isRequired,
  courseToClassmates: PropTypes.shape({ '*': SemesterlyPropTypes.classmates }).isRequired,
  loadTimetable: PropTypes.func.isRequired,
  deleteTimetable: PropTypes.func.isRequired,
  isCourseInRoster: PropTypes.func.isRequired,
  duplicateTimetable: PropTypes.func.isRequired,
  fetchCourseInfo: PropTypes.func.isRequired,
  removeCourse: PropTypes.func.isRequired,
  launchFinalExamsModal: PropTypes.func.isRequired,
  launchPeerModal: PropTypes.func.isRequired,
  semester: PropTypes.shape({
    name: PropTypes.string.isRequired,
    year: PropTypes.numberisRequired,
  }).isRequired,
  semesterIndex: PropTypes.number.isRequired,
  avgRating: PropTypes.number,
  examSupportedSemesters: PropTypes.arrayOf(PropTypes.number).isRequired,
  hasLoaded: PropTypes.bool.isRequired,
  getShareLink: PropTypes.func.isRequired,
};

export default SideBar;

export const TextbookList = ({ courses }) => {
  const tbs = flatMap(courses, getTextbooksFromCourse);

  const img = (!isNaN(parseInt(courses, 0)) && (courses.length >= 5)) ? null :
  <img src="/static/img/emptystates/textbooks.png" alt="No textbooks found." />;
  if (tbs.length === 0) {
    return (<div className="empty-state">
      { img }
      <h4>Buy & Rent Textbooks: New, Used or eBook!</h4>
      <h3>
        Textbooks for your classes will appear here. Click to find the lowest prices,
        plus FREE two day shipping with Amazon Student
      </h3>
    </div>);
  }
  return (
    <div>
      {uniqBy(tbs, tb => tb.isbn).map(tb => <Textbook tb={tb} key={tb.isbn} />)}
    </div>
  );
};

TextbookList.propTypes = {
  courses: PropTypes.arrayOf(SemesterlyPropTypes.denormalizedCourse).isRequired,
};

