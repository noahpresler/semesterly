import React from 'react';
import classnames from 'classnames';
import * as PropTypes from '../constants/propTypes';

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
      <SearchResultSection
        key={this.props.hovered.id + sec} course={this.props.hovered} section={sec}
        locked={this.props.isSectionLocked(this.props.hovered.id, sec)}
        isOnActiveTimetable={this.props.isSectionOnActiveTimetable(this.props.hovered.id, sec)}
        hoverSection={() => this.props.hoverSection(this.props.hovered, sec)}
        unHoverSection={this.props.unHoverSection}
        onMouseDown={event => this.lockSectionWrapper(sec, event)}
      />,
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
      <div id="search-bar-side">
        <div id="search-bar-side-sections">
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
  hovered: PropTypes.searchResult,
  lectureSections: React.PropTypes.shape({
    '*': PropTypes.section,
  }).isRequired,
  tutorialSections: React.PropTypes.shape({
    '*': PropTypes.section,
  }),
  practicalSections: React.PropTypes.shape({
    '*': PropTypes.section,
  }),
  addCourse: React.PropTypes.func.isRequired,
  isSectionLocked: React.PropTypes.func.isRequired,
  isSectionOnActiveTimetable: React.PropTypes.func.isRequired,
  hoverSection: React.PropTypes.func.isRequired,
  unHoverSection: React.PropTypes.func.isRequired,
};

export default SearchSideBar;

const SearchResultSection =
  ({ section, locked, hoverSection, unHoverSection, onMouseDown, isOnActiveTimetable }) => {
    let rosterIndicator = null;
    if (isOnActiveTimetable) {
      rosterIndicator = <i title="Lock this section" className="fa fa-calendar-check-o" />;
    }
    if (locked) {
      rosterIndicator = <i title="Unlock this section" className="fa fa-lock" />;
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
  unHoverSection: React.PropTypes.func.isRequired,
  onMouseDown: React.PropTypes.func.isRequired,
  isOnActiveTimetable: React.PropTypes.bool.isRequired,
  section: React.PropTypes.string.isRequired,
  hoverSection: React.PropTypes.func.isRequired,
  locked: React.PropTypes.bool.isRequired,
};
