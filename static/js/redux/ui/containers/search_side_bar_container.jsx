import {connect} from "react-redux";
import {SearchSideBar} from "../search_side_bar";
import {addOrRemoveCourse, hoverSection, unHoverSection} from "../../actions/timetable_actions";

const mapStateToProps = (state) => {
    let courseSections = state.courseSections.objects;
    let hovered = state.searchResults.items[state.ui.searchHover];
    if (!hovered) {
        hovered = state.searchResults.items[0];
    }
    let sectionTypeToSections = hovered.sections;
    let lectureSections = sectionTypeToSections.L;
    let tutorialSections = sectionTypeToSections.T;
    let practicalSections = sectionTypeToSections.P;
    let activeTimetable = state.timetables.items[state.timetables.active];

    return {
        hovered: hovered,
        lectureSections: lectureSections,
        tutorialSections: tutorialSections,
        practicalSections: practicalSections,
        isSectionLocked: (courseId, section) => {
            if (courseSections[courseId] === undefined) {
                return false;
            }
            return Object.keys(courseSections[courseId]).some(
                (type) => {
                    return courseSections[courseId][type] === section;
                }
            );
        },
        isSectionOnActiveTimetable: (courseId, section) => {
            return activeTimetable.courses.some((course) => {
                return course.id === courseId && course.enrolled_sections.some((sec) => {
                        return sec === section;
                    });
            });
        }
    };
};

const SearchSideBarContainer = connect(
    mapStateToProps,
    {
        addCourse: addOrRemoveCourse,
        hoverSection: hoverSection,
        unHoverSection: unHoverSection
    }
)(SearchSideBar);

export default SearchSideBarContainer;
