import {connect} from "react-redux";
import {SearchSideBar} from "../search_side_bar.jsx";
import {addOrRemoveCourse, hoverSection, unhoverSection} from "../../actions/timetable_actions.jsx";

const mapStateToProps = (state) => {
    let courseSections = state.courseSections.objects;
    let hovered = state.searchResults.items[state.ui.searchHover];
    if (!hovered) {
        hovered = state.searchResults.items[0];
    }
    let sectionTypeToSections = hovered.sections;
    let lectureSections = sectionTypeToSections['L'];
    let tutorialSections = sectionTypeToSections['T'];
    let practicalSections = sectionTypeToSections['P'];
    let activeTimetable = state.timetables.items[state.timetables.active];

    return {
        hovered,
        lectureSections,
        tutorialSections,
        practicalSections,
        isSectionLocked: (course_id, section) => {
            if (courseSections[course_id] === undefined) {
                return false;
            }
            return Object.keys(courseSections[course_id]).some(
                (type) => courseSections[course_id][type] == section
            )
        },
        isSectionOnActiveTimetable: (courseId, section) => {
            return activeTimetable.courses.some(course => course.id === courseId && course.enrolled_sections.some(sec => sec == section));
        }
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        addCourse: addOrRemoveCourse,
        hoverSection: hoverSection(dispatch),
        unhoverSection: unhoverSection(dispatch)
    }
}

const SearchSideBarContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(SearchSideBar);

export default SearchSideBarContainer;
