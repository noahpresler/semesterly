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
import ClickOutHandler from 'react-onclickout';
import classNames from 'classnames';
import SearchSideBarContainer from './containers/search_side_bar_container';
import * as SemesterlyPropTypes from '../constants/semesterlyPropTypes';
import SearchResult from './search_result';

class SearchBar extends React.Component {

  static getSemesterName(semester) {
    return `${semester.name} ${semester.year}`;
  }

  static abbreviateSemesterName(semesterName) {
    return semesterName[0];
  }

  static abbreviateYear(year) {
    return year.replace('20', "'");
  }

  static getAbbreviatedSemesterName(semester) {
    return `${SearchBar.abbreviateSemesterName(semester.name)}` +
      `${SearchBar.abbreviateYear(semester.year)}`;
  }


  constructor(props) {
    super(props);
    this.state = { focused: false, showDropdown: false };
    this.fetchSearchResults = this.fetchSearchResults.bind(this);
    SearchBar.getAbbreviatedSemesterName = SearchBar.getAbbreviatedSemesterName.bind(this);
    this.onClickOut = this.onClickOut.bind(this);
    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.changeTimer = false;
  }

  componentWillMount() {
    $(document.body).on('keydown', (e) => {
      if ($('input:focus').length === 0 && !this.props.explorationModalIsVisible && !e.ctrlKey) {
        if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 65 && e.keyCode <= 90)) {
          $('.search-bar input').focus();
          this.setState({ focused: true });
        }
      } else if ($('input:focus').length !== 0) {
        const numSearchResults = this.props.searchResults.length;
        if (e.key === 'Enter' && numSearchResults > 0 && this.state.showDropdown) {
          this.props.addCourse(this.props.searchResults[this.props.hoveredPosition].id);
        } else if (e.key === 'ArrowDown') {
          this.props.hoverSearchResult((this.props.hoveredPosition + 1) % numSearchResults);
        } else if (e.key === 'ArrowUp') {
          let newHoveredPosition = this.props.hoveredPosition - 1;
          newHoveredPosition = newHoveredPosition < 0 ? numSearchResults - 1 : newHoveredPosition;
          this.props.hoverSearchResult(newHoveredPosition);
        } else if (e.key === 'Escape') {
          this.setState({ focused: false });
          $('.search-bar input').blur();
        }
      }
    });
  }

  onClickOut() {
    this.setState({ showDropdown: false });
  }

  maybeSetSemester(semester) {
    this.setState({ showDropdown: false });
    this.props.maybeSetSemester(semester);
  }

  fetchSearchResults() {
    if (this.changeTimer) clearTimeout(this.changeTimer);
    const query = this.input.value;
    this.changeTimer = setTimeout(() => {
      this.props.fetchCourses(query);
      this.changeTimer = false;
    }, 200);
  }

  toggleDropdown() {
    this.setState({ showDropdown: !this.state.showDropdown });
  }

  render() {
    const resClass = classNames({ 'search-results': true, trans50: this.props.hasHoveredResult });
    const results = this.props.searchResults.map((c, i) => (<SearchResult
      {...this.props}
      course={c}
      key={c.id}
      inRoster={this.props.isCourseInRoster(c.id)}
      inOptionRoster={this.props.isCourseOptional(c.id)}
      position={i}
    />));
    const seeMore = results.length > 0 && results.length < 3 ? (
      <div className="see-more" style={{ height: 240 - (60 * results.length) }}>
        <div className="see-more__inner">
          <h4>Don&#39;t see what you&#39;re looking for?</h4>
          <p>Try switching semesters or click <i className="fa fa-compass" /> above to
                          filter by areas,
                          departments, times and more!</p>
        </div>
      </div>
    ) : null;
    const resultContainer = !this.state.focused || results.length === 0 ? null : (
      <ul className={resClass}>
        <div className="search-results__list-container">
          {results}
          {seeMore}
        </div>
        <SearchSideBarContainer />
      </ul>
        );
    const availableSemesters = this.props.allSemesters.map((semester, index) => {
      const name = ($(window).width() < 767) ?
                SearchBar.getAbbreviatedSemesterName(semester) :
                SearchBar.getSemesterName(semester);
      return (
        <div
          key={name}
          className="semester-option"
          onMouseDown={() => this.maybeSetSemester(index)}
        >
          { name }
        </div>
      );
    });
    const currSem = ($(window).width() < 767) ?
            SearchBar.getAbbreviatedSemesterName(this.props.semester) :
            SearchBar.getSemesterName(this.props.semester);
    return (
      <div className="search-bar no-print">
        <div className="search-bar__wrapper">

          <ClickOutHandler onClickOut={this.onClickOut}>
            <div className="search-bar__semester" onMouseDown={this.toggleDropdown}>
              <span
                className={classNames('tip-down', { down: this.state.showDropdown })}
              />
              {currSem}</div>
            <div
              className={classNames('semester-picker', { down: this.state.showDropdown })}
            >
              <div className="tip-border" />
              <div className="tip" />
              { availableSemesters }
            </div>
            <div id="vertical-bar"> <img id="bar-image" src="/static/img/bar.png"/> </div>
          </ClickOutHandler>

          <div className="search-bar__input-wrapper">
            <input
              ref={(c) => { this.input = c; }}
              placeholder={`Searching ${currSem}`}
              className={this.props.isFetching ? 'results-loading-gif' : ''}
              onInput={this.fetchSearchResults}
              onFocus={() => this.setState({ focused: true, showDropdown: false })}
              onBlur={() => this.setState({ focused: false })}
            />
          </div>
          <div
            className="show-exploration"
            onMouseDown={this.props.showExplorationModal}
          >
            <i className="fa fa-compass" />
            <span>Advanced Search</span>
          </div>
        </div>
        {resultContainer}
      </div>
    );
  }
}

SearchBar.propTypes = {
  addCourse: PropTypes.func.isRequired,
  explorationModalIsVisible: PropTypes.bool.isRequired,
  fetchCourses: PropTypes.func.isRequired,
  hasHoveredResult: PropTypes.bool.isRequired,
  hoverSearchResult: PropTypes.func.isRequired,
  hoveredPosition: PropTypes.number.isRequired,
  isCourseInRoster: PropTypes.func.isRequired,
  isCourseOptional: PropTypes.func.isRequired,
  isFetching: PropTypes.bool.isRequired,
  maybeSetSemester: PropTypes.func.isRequired,
  searchResults: PropTypes.arrayOf(SemesterlyPropTypes.denormalizedCourse).isRequired,
  semester: SemesterlyPropTypes.semester.isRequired,
  showExplorationModal: PropTypes.func.isRequired,
  allSemesters: PropTypes.arrayOf(SemesterlyPropTypes.semester).isRequired,
};

export default SearchBar;

