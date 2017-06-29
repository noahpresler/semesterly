import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import ClickOutHandler from 'react-onclickout';
import range from 'lodash/range';
import uniqBy from 'lodash/uniqBy';
import MasterSlot from './master_slot';
import COLOUR_DATA from '../constants/colours';
import TimetableNameInputContainer from './containers/timetable_name_input_container';
import CreditTickerContainer from './containers/credit_ticker_container';
import Textbook from './textbook';
import * as SemesterlyPropTypes from '../constants/semesterlyPropTypes';

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
    let masterSlots = this.props.mandatoryCourses ?
            this.props.mandatoryCourses.map((c) => {
              const colourIndex = this.props.courseToColourIndex[c.id] || 0;
              let classmates = this.props.classmates ?
                this.props.classmates.find(course => course.course_id === c.id) : [];
              classmates = classmates || {};
              let professors = [];
              if (c.slots.length === 0 && c.oldSlots && c.oldSlots.length > 0) {
                professors = [...new Set(c.oldSlots.map(s => s.instructors))];
              } else {
                professors = [...new Set(c.slots.map(s => s.instructors))];
              }
              return (<MasterSlot
                key={c.id}
                professors={professors}
                colourIndex={colourIndex}
                classmates={classmates}
                onTimetable={this.props.isCourseInRoster(c.id)}
                course={c}
                fetchCourseInfo={() => this.props.fetchCourseInfo(c.id)}
                removeCourse={() => this.props.removeCourse(c.id)}
                getShareLink={this.props.getShareLink}
              />);
            }) : null;
    const usedColourIndices = Object.values(this.props.courseToColourIndex);
    let optionalSlots = this.props.allCourses ? this.props.optionalCourses.map((c) => {
      let colourIndex;
      const classmates = this.props.classmates ?
        this.props.classmates.find(course => course.course_id === c.id) : [];
      if (Object.keys(this.props.courseToColourIndex).find(cid => cid === c.id) === undefined) {
        colourIndex = range(COLOUR_DATA.length).find(i =>
                    !usedColourIndices.some(x => x === i),
                );
        usedColourIndices[c.id] = colourIndex;
      } else {
        colourIndex = this.props.courseToColourIndex[c.id];
      }
      return (<MasterSlot
        key={c.id}
        onTimetable={this.props.isCourseInRoster(c.id)}
        colourIndex={colourIndex}
        classmates={classmates}
        course={c}
        fetchCourseInfo={() => this.props.fetchCourseInfo(c.id)}
        removeCourse={() => this.props.removeOptionalCourse(c)}
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
    const optionalSlotsHeader = (optionalSlots.length === 0 && masterSlots.length > 3) ? null :
    <h4 className="sb-header">Optional Courses</h4>;
    if (optionalSlots.length === 0 && masterSlots.length > 3) {
      optionalSlots = null;
    } else if (optionalSlots.length === 0) {
      const img = (
        <img
          src="/static/img/emptystates/optionalslots.png"
          alt="No optional courses added."
        />);
      optionalSlots = (
        <div className="empty-state">
          { img }
          <h4>Give Optional Courses a Spin!</h4>
          <h3>Load this list with courses you aren&#39;t 100% sure you want to take - we&#39;ll
                        fit as many as
                        possible, automatically</h3>
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
        { optionalSlotsHeader }
        { optionalSlots }
        <div id="sb-optional-slots" />
        <a onClick={this.props.launchTextbookModal}>
          <h4 className="sb-header"> Textbooks
            <div className="sb-header-link"><i className="fa fa-external-link" />&nbsp;See all</div>
          </h4>
        </a>
        <div className="side-bar-section">
          <TextbookList courses={this.props.allCourses} />
        </div>
      </div>
    );
  }
}

SideBar.defaultProps = {
  classmates: null,
  optionalCourses: null,
  savedTimetables: null,
  avgRating: 0,
};

SideBar.propTypes = {
  savedTimetables: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
  })),
  mandatoryCourses: PropTypes.arrayOf(PropTypes.shape({ // TODO
    id: PropTypes.number,
    slots: PropTypes.arrayOf(PropTypes.shape({
      instructors: PropTypes.string,
    })),
    oldSlots: PropTypes.arrayOf(PropTypes.shape({
      instructors: PropTypes.string,
    })),
  })).isRequired,
  courseToColourIndex: PropTypes.shape({
    id: PropTypes.string,
  }).isRequired,
  classmates: SemesterlyPropTypes.classmates.isRequired,
  optionalCourses: PropTypes.arrayOf(PropTypes.shape({ // TODO
    id: PropTypes.number,
    slots: PropTypes.arrayOf(PropTypes.shape({
      instructors: PropTypes.string,
    })),
    oldSlots: PropTypes.arrayOf(PropTypes.shape({
      instructors: PropTypes.string,
    })),
  })),
  loadTimetable: PropTypes.func.isRequired,
  deleteTimetable: PropTypes.func.isRequired,
  isCourseInRoster: PropTypes.func.isRequired,
  duplicateTimetable: PropTypes.func.isRequired,
  fetchCourseInfo: PropTypes.func.isRequired,
  removeCourse: PropTypes.func.isRequired,
  removeOptionalCourse: PropTypes.func.isRequired,
  launchFinalExamsModal: PropTypes.func.isRequired,
  launchPeerModal: PropTypes.func.isRequired,
  launchTextbookModal: PropTypes.func.isRequired,
  allCourses: PropTypes.arrayOf(PropTypes.shape({ // TODO: wrong shape
    id: PropTypes.number,
    slots: PropTypes.arrayOf(PropTypes.shape({
      instructors: PropTypes.string,
    })),
    oldSlots: PropTypes.arrayOf(PropTypes.shape({
      instructors: PropTypes.string,
    })),
  })).isRequired,
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
  let tbs = [];
  for (let i = 0; i < courses.length; i++) {
    if (courses[i].textbooks !== undefined && Object.keys(courses[i].textbooks).length > 0) {
      for (let j = 0; j < courses[i].enrolled_sections.length; j++) {
        tbs = tbs.concat(courses[i].textbooks[courses[i].enrolled_sections[j]]);
      }
    }
  }
  const img = (!isNaN(parseInt(courses, 0)) && (courses.length >= 5)) ? null :
  <img src="/static/img/emptystates/textbooks.png" alt="No textbooks found." />;
  if (tbs.length === 0) {
    return (<div className="empty-state">
      { img }
      <h4>Buy & Rent Textbooks: New, Used or eBook!</h4>
      <h3>Textbooks for your classes will appear here. Click to find the lowest prices, plus
                FREE two day shipping
                with Amazon Student</h3>
    </div>);
  }
  return (
    <div>
      {uniqBy(tbs, tb => tb.isbn).map(tb => <Textbook tb={tb} key={tb.isbn} />)}
    </div>
  );
};

TextbookList.defaultProps = {
  courses: null,
};

TextbookList.propTypes = {
  courses: PropTypes.arrayOf(PropTypes.shape({
    textbooks: PropTypes.arrayOf(PropTypes.shape({
      isbn: PropTypes.string,
    })),
  })),
};

