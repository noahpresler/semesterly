/**
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
**/

import PropTypes from 'prop-types';
import React from 'react';
import classnames from 'classnames';
import * as SemesterlyPropTypes from '../constants/semesterlyPropTypes';

class SearchSideBar extends React.Component {
  constructor(props) {
    super(props);
    this.lockSectionWrapper = this.lockSectionWrapper.bind(this);
  }

  lockSectionWrapper(section, event) {
    event.preventDefault();
    event.stopPropagation();
    this.props.addCourse(this.props.hovered.id, section);
  }

  mapSectionsToSlots(sections) {
    if (sections === undefined) {
      return [];
    }
    return Object.keys(sections).sort().map(sec =>
      (<SearchResultSection
        key={this.props.hovered.id + sec}
        course={this.props.hovered}
        section={sec}
        locked={this.props.isSectionLocked(this.props.hovered.id, sec)}
        isOnActiveTimetable={this.props.isSectionOnActiveTimetable(this.props.hovered.id, sec)}
        hoverSection={() => this.props.hoverSection(this.props.hovered, sec)}
        unHoverSection={this.props.unHoverSection}
        onMouseDown={event => this.lockSectionWrapper(sec, event)}
      />),
        );
  }

  render() {
    const lecs = this.mapSectionsToSlots(this.props.lectureSections);
    const tuts = this.mapSectionsToSlots(this.props.tutorialSections);
    const pracs = this.mapSectionsToSlots(this.props.practicalSections);
    let lectureSections = null;
    let tutorialSections = null;
    let practicalSections = null;
    if (lecs.length > 0) {
      lectureSections = <div><h4> Lecture Sections </h4>{lecs}</div>;
    }
    if (tuts.length > 0) {
      tutorialSections = <div><h4> Tutorial Sections </h4>{tuts}</div>;
    }
    if (pracs.length > 0) {
      practicalSections = <div><h4> Lab/Practical Sections </h4>{pracs}</div>;
    }
    return (
      <div className="search-bar__side">
        <div className="search-bar__side-sections">
          <h3>{this.props.hovered.name}</h3>
          <p>Hover over a section below for a preview on your timetable! </p>
          {lectureSections}
          {tutorialSections}
          {practicalSections}
        </div>
      </div>
    );
  }
}

SearchSideBar.defaultProps = {
  hovered: null,
  tutorialSections: {},
  practicalSections: {},
};

SearchSideBar.propTypes = {
  hovered: SemesterlyPropTypes.searchResult,
  lectureSections: PropTypes.shape({
    '*': SemesterlyPropTypes.section,
  }).isRequired,
  tutorialSections: PropTypes.shape({
    '*': SemesterlyPropTypes.section,
  }),
  practicalSections: PropTypes.shape({
    '*': SemesterlyPropTypes.section,
  }),
  addCourse: PropTypes.func.isRequired,
  isSectionLocked: PropTypes.func.isRequired,
  isSectionOnActiveTimetable: PropTypes.func.isRequired,
  hoverSection: PropTypes.func.isRequired,
  unHoverSection: PropTypes.func.isRequired,
};

export default SearchSideBar;

const SearchResultSection =
  ({ section, locked, hoverSection, unHoverSection, onMouseDown, isOnActiveTimetable }) => {
    let rosterIndicator = null;
    if (isOnActiveTimetable) {
      rosterIndicator = (<i
        title="Lock this section"
        className="fa fa-calendar-check-o"
      />);
    }
    if (locked) {
      rosterIndicator = (<i
        title="Unlock this section"
        className="fa fa-lock"
      />);
    }

    return (
      <h5
        className={classnames('sb-side-sections', { 'on-active-timetable': isOnActiveTimetable })}

        onMouseDown={onMouseDown}
        onMouseEnter={hoverSection}
        onMouseLeave={unHoverSection}
        title={locked ? 'Unlock this section' : 'Lock this section'}
      >
        {`${section} `}
        {rosterIndicator}
      </h5>);
  };

SearchResultSection.propTypes = {
  unHoverSection: PropTypes.func.isRequired,
  onMouseDown: PropTypes.func.isRequired,
  isOnActiveTimetable: PropTypes.bool.isRequired,
  section: PropTypes.string.isRequired,
  hoverSection: PropTypes.func.isRequired,
  locked: PropTypes.bool.isRequired,
};

