import { connect } from 'react-redux';
import { getActiveTT, getSearchResult } from '../../reducers/root_reducer';
import { getSectionTypeToSections } from '../../reducers/entities_reducer';
import SearchSideBar from '../search_side_bar';
import { addOrRemoveCourse, hoverSection, unHoverSection } from '../../actions/timetable_actions';

const mapStateToProps = (state) => {
  const courseSections = state.courseSections.objects;
  let hoveredResult = getSearchResult(state, state.ui.searchHover);
  if (!hoveredResult) {
    hoveredResult = getSearchResult(state, 0);
  }
  const activeTimetable = getActiveTT(state);
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
    isSectionOnActiveTimetable: (courseId, section) => activeTimetable.courses
      .some(course => course.id === courseId && course.enrolled_sections
        .some(sec => sec === section)),
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
