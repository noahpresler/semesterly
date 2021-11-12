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
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ClickOutHandler from 'react-onclickout';
import classNames from 'classnames';
import SearchSideBarContainer from './containers/search_side_bar_container';
import * as SemesterlyPropTypes from '../constants/semesterlyPropTypes';
import SearchResult from './search_result';

/* eslint-disable react/no-unused-prop-types */

const getSemesterName = semester => `${semester.name} ${semester.year}`;

const abbreviateSemesterName = (semesterName) => {
  if (semesterName === 'Summer') {
    return 'Su';
  }
  return semesterName[0];
};

const abbreviateYear = year => year.replace('20', "'");

const getAbbreviatedSemesterName = semester => `${abbreviateSemesterName(semester.name)}` +
    `${abbreviateYear(semester.year)}`;

const SearchBar = (props) => {
  const [inputFocused, setInputFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const input = useRef();

  useEffect(() => {
    // better way to search, only run API call when user stops typing for 1 seconds
    const timeoutId = setTimeout(() => {
      // when user stops typing we search
      props.fetchCourses(searchTerm);
    }, 1000);
    // clear timeout everytime user updates query
    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchTerm]);

  const handleKeyDown = useCallback((e) => {
    if (
      $('input:focus').length === 0 &&
      !props.explorationModalIsVisible &&
      !e.ctrlKey
    ) {
      // autofocus if no other inputs are focused
      if (
        (e.keyCode >= 48 && e.keyCode <= 57) ||
        (e.keyCode >= 65 && e.keyCode <= 90)
      ) {
        // only focus if user inputted char or number
        input.current.focus();
      }
    } else if ($('input:focus').length !== 0) {
      const numSearchResults = props.searchResults.length;
      if (e.key === 'Enter' && numSearchResults > 0 && inputFocused) {
        // add course to timetable if user press enter on while hovering on a search result
        props.addCourse(props.searchResults[props.hoveredPosition].id);
      } else if (e.key === 'ArrowDown') {
        // change hovered course
        props.hoverSearchResult((props.hoveredPosition + 1) % numSearchResults);
      } else if (e.key === 'ArrowUp') {
        // change hovered course
        let newHoveredPosition = props.hoveredPosition - 1;
        newHoveredPosition =
          newHoveredPosition < 0 ? numSearchResults - 1 : newHoveredPosition;
        props.hoverSearchResult(newHoveredPosition);
      } else if (e.key === 'Escape') {
        // do not show resultsContainer if user pressed escape
        setInputFocused(false);
        input.current.blur();
      }
    }
  });

  useEffect(() => {
    $(document.body).on('keydown', handleKeyDown);
    return () => {
      $(document.body).off('keydown');
    };
  }, [handleKeyDown]);

  const onClickOut = () => {
    setShowDropdown(false);
  };

  const maybeSetSemester = (semester) => {
    setShowDropdown(false);
    props.maybeSetSemester(semester);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const resClass = classNames({ 'search-results': true, trans50: props.hasHoveredResult });
  const results = props.searchResults.map((c, i) => (<SearchResult
    {...props}
    course={c}
    key={c.id}
    inRoster={props.isCourseInRoster(c.id)}
    inOptionRoster={props.isCourseOptional(c.id)}
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
  const resultContainer = !inputFocused || results.length === 0 ? null : (
    <ul className={resClass}>
      <div className="search-results__list-container">
        {results}
        {seeMore}
      </div>
      <SearchSideBarContainer />
    </ul>
      );
  const availableSemesters = props.allSemesters.map((semester, index) => {
    const name = ($(window).width() < 767) ?
              getAbbreviatedSemesterName(semester) :
              getSemesterName(semester);
    return (
      <div
        key={name}
        className="semester-option"
        onMouseDown={() => maybeSetSemester(index)}
      >
        { name }
      </div>
    );
  });
  const currSem = ($(window).width() < 767) ?
          getAbbreviatedSemesterName(props.semester) :
          getSemesterName(props.semester);
  const resultsShown = results.length !== 0 && inputFocused && !props.hasHoveredResult;
  return (
    <div className="search-bar no-print">
      <div
        className={classNames('search-bar__wrapper', { results: resultsShown })}
      >
        <ClickOutHandler onClickOut={onClickOut}>
          <div
            className={classNames('search-bar__semester', {
              results: resultsShown,
            })}
            onMouseDown={toggleDropdown}
          >
            <span className={classNames('tip-down', { down: showDropdown })} />
            {currSem}
            <span className="bar">|</span>
          </div>
          <div
            className={classNames('semester-picker', { down: showDropdown })}
          >
            <div className="tip-border" />
            <div className="tip" />
            {availableSemesters}
          </div>
        </ClickOutHandler>

        <div className="search-bar__input-wrapper">
          <input
            ref={input}
            placeholder={`Searching ${currSem}`}
            className={classNames(
              props.isFetching ? 'results-loading-gif' : '',
              { results: resultsShown },
            )}
            onChange={e => setSearchTerm(e.target.value)}
            onFocus={() => {
              setInputFocused(true);
              setShowDropdown(false);
            }}
            onBlur={() => setInputFocused(false)}
            focus
          />
        </div>
        <div
          className="show-exploration"
          onMouseDown={props.showExplorationModal}
        >
          <i className="fa fa-compass" />
          <span>Advanced Search</span>
        </div>
      </div>
      {resultContainer}
    </div>
  );
};

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

