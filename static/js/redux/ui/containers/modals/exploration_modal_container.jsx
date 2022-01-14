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
import {
  getCurrentSemester,
  getDenormAdvancedSearchResults,
  getHoveredSlots,
} from '../../../reducers';
import ExplorationModal from '../../modals/exploration_modal';
import {
    clearAdvancedSearchPagination,
    fetchAdvancedSearchResults,
    paginateAdvancedSearchResults,
    setAdvancedSearchResultIndex,
} from '../../../actions/search_actions';
import {
    addOrRemoveCourse,
    addOrRemoveOptionalCourse,
    unHoverSection,
} from '../../../actions/timetable_actions';
import { getSchoolSpecificInfo } from '../../../constants/schools';
import {
    fetchCourseClassmates,
    hideExplorationModal,
} from '../../../actions/modal_actions';
import { getCourseShareLinkFromModal } from '../../../constants/endpoints';


const mapStateToProps = (state) => {
  const { isVisible, isFetching, active, page } = state.explorationModal;
  const advancedSearchResults = getDenormAdvancedSearchResults(state);
  const courseSections = state.courseSections.objects;
  const course = advancedSearchResults[active];
  const inRoster = course && (courseSections[course.id] !== undefined);
  const { areas, departments, levels } = state.school;
  const semester = getCurrentSemester(state);
  return {
    isVisible,
    isFetching,
    advancedSearchResults,
    active,
    inRoster,
    areas,
    departments,
    levels,
    page,
    semesterName: `${semester.name} ${semester.year}`,
    schoolSpecificInfo: getSchoolSpecificInfo(state.school.school),
    hasHoveredResult: getHoveredSlots(state) !== null,
    getShareLink: courseCode => getCourseShareLinkFromModal(courseCode, getCurrentSemester(state)),
  };
};

const ExplorationModalContainer = connect(
    mapStateToProps,
  {
    hideExplorationModal,
    fetchAdvancedSearchResults,
    fetchCourseClassmates,
    addOrRemoveOptionalCourse,
    unHoverSection,
    addOrRemoveCourse,
    paginate: paginateAdvancedSearchResults,
    clearPagination: clearAdvancedSearchPagination,
    setAdvancedSearchResultIndex,
  },
)(ExplorationModal);

export default ExplorationModalContainer;
