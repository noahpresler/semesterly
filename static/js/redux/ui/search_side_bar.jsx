import PropTypes from 'prop-types';
import React from 'react';
import classnames from 'classnames';
import { getSectionTypeDisplayName } from '../util';
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
    return sections.map(section => section.meeting_section).sort().map(sectionCode =>
      (<SearchResultSection
        key={this.props.hoveredResult.id + sectionCode}
        section={sectionCode}
        locked={this.props.isSectionLocked(this.props.hoveredResult.id, sectionCode)}
        isOnActiveTimetable={
          this.props.isSectionOnActiveTimetable(this.props.hoveredResult.id, sectionCode)
        }
        hoverSection={() => this.props.hoverSection(this.props.hoveredResult, sectionCode)}
        unHoverSection={this.props.unHoverSection}
        onMouseDown={event => this.lockSectionWrapper(sectionCode, event)}
      />),
    );
  }

  render() {
    const sectionGrid = Object.keys(this.props.sectionTypeToSections).sort().map((sectionType) => {
      const sectionTitle = `${getSectionTypeDisplayName(sectionType)} Sections`;
      return (
        <div>
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
  hoveredResult: SemesterlyPropTypes.searchResult,
  sectionTypeToSections: PropTypes.shape({
    '*': PropTypes.arrayOf(SemesterlyPropTypes.section),
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

