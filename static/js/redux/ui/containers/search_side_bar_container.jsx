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

import { connect } from 'react-redux';
import { getActiveTimetable, getSearchResult } from '../../reducers';
import { getSectionTypeToSections } from '../../reducers/entities_reducer';
import SearchSideBar from '../search_side_bar';
import { addOrRemoveCourse, hoverSection, unHoverSection } from '../../actions/timetable_actions';

const mapStateToProps = (state) => {
  const courseSections = state.courseSections.objects;
  let hoveredResult = getSearchResult(state, state.ui.searchHover);
  if (!hoveredResult) {
    hoveredResult = getSearchResult(state, 0);
  }
  const activeTimetable = getActiveTimetable(state);
  return {
    hoveredResult,
    sectionTypeToSections: getSectionTypeToSections(hoveredResult),
    isSectionLocked: (courseId, section) => {
      if (courseSections[courseId] === undefined) {
        return false;
      }
      return Object.keys(courseSections[courseId]).some(
                type => courseSections[courseId][type] === section,
            );
    },
    isSectionOnActiveTimetable: (course, section) =>
      activeTimetable.slots.some(slot => slot.course === course.id && slot.section === section.id),
  };
};

const SearchSideBarContainer = connect(
    mapStateToProps,
  {
    addCourse: addOrRemoveCourse,
    hoverSection,
    unHoverSection,
  },
)(SearchSideBar);

export default SearchSideBarContainer;
