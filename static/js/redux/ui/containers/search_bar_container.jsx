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

import { connect } from 'react-redux';
import {
    fetchSearchResults,
    hoverSearchResult,
    maybeSetSemester,
} from '../../actions/search_actions';
import { addOrRemoveCourse, addOrRemoveOptionalCourse } from '../../actions/timetable_actions';
import SearchBar from '../search_bar';
import { fetchCourseInfo, showExplorationModal } from '../../actions/modal_actions';
import { getSchoolSpecificInfo } from '../../constants/schools';
import { openIntegrationModal } from '../../actions/user_actions';
import { currSem } from '../../reducers/semester_reducer';

const mapStateToProps = (state) => {
  const { isVisible } = state.explorationModal;
  const courseSections = state.courseSections.objects;
  const schoolSpecificInfo = getSchoolSpecificInfo(state.school.school);
  const schoolSpecificCampuses = schoolSpecificInfo.campuses;
  return {
    semester: currSem(state.semester),
    allSemesters: state.semester.all,
    campuses: schoolSpecificCampuses,
    searchResults: state.searchResults.items,
    isFetching: state.searchResults.isFetching,
    isCourseInRoster: courseId => courseSections[courseId] !== undefined,
    isCourseOptional: courseId => state.optionalCourses.courses.some(c => c.id === courseId),
    hasHoveredResult: state.timetables.items[state.timetables.active]
      .courses.some(course => course.fake),
    isHovered: position => state.ui.searchHover === position,
    hoveredPosition: state.ui.searchHover,
    explorationModalIsVisible: isVisible,
    studentIntegrations: state.integrations,
  };
};

const SearchBarContainer = connect(
    mapStateToProps,
  {
    fetchCourses: fetchSearchResults,
    addCourse: addOrRemoveCourse,
    addRemoveOptionalCourse: addOrRemoveOptionalCourse,
    fetchCourseInfo,
    showExplorationModal,
    showIntegrationModal: openIntegrationModal,
    hoverSearchResult,
    maybeSetSemester,
  },
)(SearchBar);

export default SearchBarContainer;
