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
import { getSectionTypeToSections } from '../reducers/entities_reducer';
import * as SemesterlyPropTypes from '../constants/semesterlyPropTypes';


class SearchResult extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hoverAdd: false, hoverSave: false };
    this.addCourseWrapper = this.addCourseWrapper.bind(this);
    this.actionOver = this.actionOver.bind(this);
    this.actionOut = this.actionOut.bind(this);
    this.hasOnlyWaitlistedSections = this.hasOnlyWaitlistedSections.bind(this);
  }

  addCourseWrapper(course, sec, event) {
    event.stopPropagation(); // stops modal from popping up
    event.preventDefault(); // stops search bar from blurring (losing focus)
    this.props.addCourse(course.id, sec);
  }

  addOptionalCourseWrapper(course, event) {
    event.stopPropagation(); // stops modal from popping up
    event.preventDefault(); // stops search bar from blurring (losing focus)
    this.props.addRemoveOptionalCourse(course);
  }

  actionOver(action) {
    switch (action) {
      case 'ADD':
        this.setState({ hoverAdd: true });
        break;
      case 'SAVE':
        this.setState({ hoverSave: true });
        break;
      default:
        break;
    }
  }

  actionOut(action) {
    switch (action) {
      case 'ADD':
        this.setState({ hoverAdd: false });
        break;
      case 'SAVE':
        this.setState({ hoverSave: false });
        break;
      default:
        break;
    }
  }

  /**
   * Checks if a course is Waitlist Only
   * Loops through each section type first (Lecture, Tutorial, Practical)
   * if any of the section types doesn't have open seats, the course is waitlist only
   * Within each section type, loops through each section
   * if section doesn't have meeting times, doesn't have enrolment cap
   * if section has open seats, don't check rest of sections in section type, move onto
   * next section type.
   * @returns {boolean}
   */
  hasOnlyWaitlistedSections() {
    const sectionTypeToSections = getSectionTypeToSections(this.props.course);
    const sectionTypes = Object.keys(sectionTypeToSections);
    for (let i = 0; i < sectionTypes.length; i++) {
      const sectionType = sectionTypes[i];
      let sectionTypeHasOpenSections = false;
      const currSections = Object.keys(sectionTypeToSections[sectionType]);
      for (let j = 0; j < currSections.length; j++) {
        const section = currSections[j];
        if (sectionTypeToSections[sectionType][section].length > 0) {
          const currSection = sectionTypeToSections[sectionType][section][0];
          const hasEnrolmentData = currSection.enrolment >= 0;
          if (!hasEnrolmentData || currSection.enrolment < currSection.size) {
            sectionTypeHasOpenSections = true;
            break;
          }
        } else {
          return false;
        }
      }
      if (!sectionTypeHasOpenSections) {
        return true; // lecture, practical, or tutorial doesn't have open seats
      }
    }
    return false;
  }

  render() {
    const { course, inRoster, inOptionRoster } = this.props;
    const addRemoveButton =
      (<span
        title="Add this course"
        className={classNames('search-course-add', { 'in-roster': inRoster })}
        onMouseDown={event => this.addCourseWrapper(course, '', event)}
        onMouseOver={() => this.actionOver('ADD')}
        onMouseOut={() => this.actionOut('ADD')}
      >
        <i className={classNames('fa', { 'fa-plus': !inRoster, 'fa-check': inRoster })} />
      </span>);
    const addOptionalCourseButton = this.props.inRoster ? null :
      (<span
        title="Add this course as optional"
        className={classNames('search-course-save', { 'in-roster': inOptionRoster })}
        onMouseDown={event => this.addOptionalCourseWrapper(course, event)}
        onMouseOver={() => this.actionOver('SAVE')}
        onMouseOut={() => this.actionOut('SAVE')}
      >
        <i
          className={classNames('fa', {
            'fa-bookmark': !inOptionRoster,
            'fa-check': inOptionRoster,
          })}
        />
      </span>);
    let info = course.name ? course.code : '';
    if (this.state.hoverSave) {
      info = !inOptionRoster ? 'Add this as an optional course' : 'Remove this optional course';
    } else if (this.state.hoverAdd) {
      info = !inRoster ? 'Add this course to your timetable' :
        'Remove this course from your timetable';
    }
    const pilotLogoImg = {
      backgroundImage: 'url(/static/img/integrations/pilotLogo.png)',
    };
    const pilotLogo = course.integrations.indexOf('Pilot') > -1 ?
      (<div className="label integration">
        <span className="has-pilot" style={pilotLogoImg} />
      </div>) : null;
    const learningDenLogoImg = {
      backgroundImage: 'url(/static/img/integrations/learningDen.png)',
    };
    const learningDenLogo = course.integrations.indexOf('LearningDen') > -1 ? (<div className="label integration">
      <span className="has-den" style={learningDenLogoImg} />
    </div>) : null;
    const waitlistOnlyFlag = this.hasOnlyWaitlistedSections() ?
      <h4 className="label flag">Waitlist Only</h4> : null;
    return (
      <li
        key={course.id}
        className={classNames('search-course', {
          hovered: this.props.isHovered(this.props.position),
        })}
        onMouseDown={() => this.props.fetchCourseInfo(course.id)}
        onMouseOver={() => this.props.hoverSearchResult(this.props.position)}
      >
        <h3>{course.name || course.code} </h3>
        { addOptionalCourseButton}
        { addRemoveButton }
        <div className="search-result-labels">
          <h4
            className={classNames('label', {
              hoverAdd: this.state.hoverAdd,
              hoverSave: this.state.hoverSave,
            })}
          >
            {info}
          </h4>
          <h4
            className={classNames('label', 'bubble')}
          >{this.props.campuses[course.campus]}</h4>
          { pilotLogo }
          { learningDenLogo }
          { waitlistOnlyFlag }
        </div>
      </li>);
  }
}

SearchResult.propTypes = {
  course: SemesterlyPropTypes.denormalizedCourse.isRequired,
  inRoster: PropTypes.bool.isRequired,
  inOptionRoster: PropTypes.bool.isRequired,
  position: PropTypes.number.isRequired,
  hoverSearchResult: PropTypes.func.isRequired,
  fetchCourseInfo: PropTypes.func.isRequired,
  campuses: PropTypes.shape({
    '*': PropTypes.string,
  }).isRequired,
  addCourse: PropTypes.func.isRequired,
  isHovered: PropTypes.func.isRequired,
  addRemoveOptionalCourse: PropTypes.func.isRequired,
};

export default SearchResult;

