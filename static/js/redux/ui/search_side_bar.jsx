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
import classnames from 'classnames';
import { getSectionTypeDisplayName, strPropertyCmp } from '../util';
import * as SemesterlyPropTypes from '../constants/semesterlyPropTypes';

class SearchSideBar extends React.Component {
  constructor(props) {
    super(props);
    this.lockSectionWrapper = this.lockSectionWrapper.bind(this);
  }

  lockSectionWrapper(section, event) {
    event.preventDefault();
    event.stopPropagation();
    this.props.addCourse(this.props.hoveredResult.id, section);
  }

  mapSectionsToSlots(sections) {
    return sections.sort(strPropertyCmp('meeting_section')).map(section =>
      (<SearchResultSection
        key={this.props.hoveredResult.id + section.meeting_section}
        section={section.meeting_section}
        locked={this.props.isSectionLocked(this.props.hoveredResult.id, section.meeting_section)}
        isOnActiveTimetable={
          this.props.isSectionOnActiveTimetable(this.props.hoveredResult, section)
        }
        hoverSection={() => this.props.hoverSection(this.props.hoveredResult,
          section)}
        unHoverSection={this.props.unHoverSection}
        onMouseDown={event => this.lockSectionWrapper(section.meeting_section, event)}
      />),
    );
  }

  render() {
    const sectionGrid = Object.keys(this.props.sectionTypeToSections).sort().map((sectionType) => {
      const sectionTitle = `${getSectionTypeDisplayName(sectionType)} Sections`;
      return (
        <div key={sectionType}>
          <h4> {sectionTitle} </h4>
          {this.mapSectionsToSlots(this.props.sectionTypeToSections[sectionType])}
        </div>
      );
    });
    return (
      <div className="search-bar__side">
        <div className="search-bar__side-sections">
          <h3>{this.props.hoveredResult.name}</h3>
          <p>Hover over a section below for a preview on your timetable! </p>
          {sectionGrid}
        </div>
      </div>
    );
  }
}

SearchSideBar.defaultProps = {
  hoveredResult: null,
  tutorialSections: {},
  practicalSections: {},
};

SearchSideBar.propTypes = {
  hoveredResult: SemesterlyPropTypes.denormalizedCourse,
  sectionTypeToSections: PropTypes.shape({
    '*': PropTypes.arrayOf(SemesterlyPropTypes.denormalizedSection),
  }).isRequired,
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

