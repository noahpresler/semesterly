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

import React, { useState, useEffect, useRef, useCallback, KeyboardEvent } from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
// @ts-ignore
import ClickOutHandler from "react-onclickout";
import classNames from "classnames";
import SearchSideBarContainer from "./containers/search_side_bar_container";
import SearchResult from "./SearchResult";
import { DenormalizedCourse, Semester } from "../constants/commonTypes";
import { addOrRemoveCourse, fetchSearchResults, maybeSetSemester } from "../actions";
import { hoverSearchResult } from "../state/slices/uiSlice";
import { explorationModalActions } from "../state/slices";
import { getCurrentSemester, getHoveredSlots, getSearchResults } from "../state";

const getSemesterName = (semester: Semester) => `${semester.name} ${semester.year}`;

const abbreviateSemesterName = (semesterName: string) => {
  if (semesterName === "Summer") {
    return "Su";
  }
  return semesterName[0];
};

const abbreviateYear = (year: string) => year.replace("20", "'");

const getAbbreviatedSemesterName = (semester: Semester) =>
  `${abbreviateSemesterName(semester.name)}${abbreviateYear(semester.year)}`;

const SearchBar = () => {
  const explorationModalIsVisible = useAppSelector(
    (state) => state.explorationModal.isVisible
  );
  const semester = useAppSelector((state) => getCurrentSemester(state));
  const allSemesters = useAppSelector((state) => state.semester.all);
  const searchResults = useAppSelector((state) => getSearchResults(state));
  const isFetching = useAppSelector((state) => state.searchResults.isFetching);
  const hasHoveredResult = useAppSelector((state) => getHoveredSlots(state) !== null);
  const hoveredPosition = useAppSelector((state) => state.ui.searchHover);

  const dispatch = useAppDispatch();

  const [inputFocused, setInputFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const input = useRef<HTMLInputElement>();

  useEffect(() => {
    // better way to search, only run API call when user stops typing for 1 seconds
    const timeoutId = setTimeout(() => {
      // when user stops typing we search
      dispatch(fetchSearchResults(searchTerm));
    }, 1000);
    // clear timeout everytime user updates query
    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchTerm]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ($("input:focus").length === 0 && !explorationModalIsVisible && !e.ctrlKey) {
        // autofocus if no other inputs are focused
        if (
          (e.keyCode >= 48 && e.keyCode <= 57) ||
          (e.keyCode >= 65 && e.keyCode <= 90)
        ) {
          // only focus if user inputted char or number
          input.current.focus();
        }
      } else if ($("input:focus").length !== 0) {
        const numSearchResults = searchResults.length;
        if (e.key === "Enter" && numSearchResults > 0 && inputFocused) {
          // add course to timetable if user press enter on while hovering on a search result
          dispatch(addOrRemoveCourse(searchResults[hoveredPosition].id));
        } else if (e.key === "ArrowDown") {
          // change hovered course
          dispatch(hoverSearchResult((hoveredPosition + 1) % numSearchResults));
        } else if (e.key === "ArrowUp") {
          // change hovered course
          let newHoveredPosition = hoveredPosition - 1;
          newHoveredPosition =
            newHoveredPosition < 0 ? numSearchResults - 1 : newHoveredPosition;
          dispatch(hoverSearchResult(newHoveredPosition));
        } else if (e.key === "Escape") {
          // do not show resultsContainer if user pressed escape
          setInputFocused(false);
          input.current.blur();
        }
      }
    },
    [explorationModalIsVisible, searchResults, hoveredPosition]
  );

  useEffect(() => {
    // @ts-ignore
    $(document).on("keydown", handleKeyDown);
    return () => {
      $(document).off("keydown");
    };
  }, [handleKeyDown]);

  const onClickOut = () => {
    setShowDropdown(false);
  };

  const hideDropdownAndMaybeSetSemester = (semesterIndex: number) => {
    setShowDropdown(false);
    dispatch(maybeSetSemester(semesterIndex));
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const resClass = classNames({
    "search-results": true,
    trans50: hasHoveredResult,
  });
  const results = searchResults.map((c: DenormalizedCourse, i: number) => (
    <SearchResult key={c.id} course={c} position={i} />
  ));
  const seeMore =
    results.length > 0 && results.length < 3 ? (
      <div className="see-more" style={{ height: 240 - 60 * results.length }}>
        <div className="see-more__inner">
          <h4>Don&#39;t see what you&#39;re looking for?</h4>
          <p>
            Try switching semesters or click <i className="fa fa-compass" /> above to
            filter by areas, departments, times and more!
          </p>
        </div>
      </div>
    ) : null;
  const resultContainer =
    !inputFocused || results.length === 0 ? null : (
      <ul className={resClass}>
        <div className="search-results__list-container">
          {results}
          {seeMore}
        </div>
        <SearchSideBarContainer />
      </ul>
    );
  const availableSemesters = allSemesters.map((semester: Semester, index: number) => {
    const name =
      $(window).width() < 767
        ? getAbbreviatedSemesterName(semester)
        : getSemesterName(semester);
    return (
      <div
        key={name}
        className="semester-option"
        onMouseDown={() => hideDropdownAndMaybeSetSemester(index)}
      >
        {name}
      </div>
    );
  });
  const currSem =
    $(window).width() < 767
      ? getAbbreviatedSemesterName(semester)
      : getSemesterName(semester);
  const resultsShown = results.length !== 0 && inputFocused && !hasHoveredResult;
  return (
    <div className="search-bar no-print">
      <div className={classNames("search-bar__wrapper", { results: resultsShown })}>
        <ClickOutHandler onClickOut={onClickOut}>
          <div
            className={classNames("search-bar__semester", {
              results: resultsShown,
            })}
            onMouseDown={toggleDropdown}
          >
            <span className={classNames("tip-down", { down: showDropdown })} />
            {currSem}
            <span className="bar">|</span>
          </div>
          <div className={classNames("semester-picker", { down: showDropdown })}>
            <div className="tip-border" />
            <div className="tip" />
            {availableSemesters}
          </div>
        </ClickOutHandler>

        <div className="search-bar__input-wrapper">
          <input
            ref={input}
            placeholder={`Searching ${currSem}`}
            className={classNames(isFetching ? "results-loading-gif" : "", {
              results: resultsShown,
            })}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              setInputFocused(true);
              setShowDropdown(false);
            }}
            onBlur={() => setInputFocused(false)}
          />
        </div>
        <div
          className="show-exploration"
          onMouseDown={() => dispatch(explorationModalActions.showExplorationModal())}
        >
          <i className="fa fa-compass" />
          <span>Advanced Search</span>
        </div>
      </div>
      {resultContainer}
    </div>
  );
};

export default SearchBar;
