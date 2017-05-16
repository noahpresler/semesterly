import { connect } from 'react-redux';
import SearchSideBar from '../search_side_bar';
import { addOrRemoveCourse, hoverSection, unHoverSection } from '../../actions/timetable_actions';

const mapStateToProps = (state) => {
  const courseSections = state.courseSections.objects;
  let hovered = state.searchResults.items[state.ui.searchHover];
  if (!hovered) {
    hovered = state.searchResults.items[0];
  }
  const sectionTypeToSections = hovered.sections;
  const lectureSections = sectionTypeToSections.L;
  const tutorialSections = sectionTypeToSections.T;
  const practicalSections = sectionTypeToSections.P;
  const activeTimetable = state.timetables.items[state.timetables.active];

  return {
    hovered,
    lectureSections,
    tutorialSections,
    practicalSections,
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
