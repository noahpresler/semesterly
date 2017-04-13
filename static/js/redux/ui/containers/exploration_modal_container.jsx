import {connect} from "react-redux";
import {ExplorationModal} from "../exploration_modal";
import {
    clearAdvancedSearchPagination,
    fetchAdvancedSearchResults,
    paginateAdvancedSearchResults,
    setAdvancedSearchResultIndex
} from "../../actions/search_actions";
import {
    addOrRemoveCourse,
    addOrRemoveOptionalCourse,
    hoverSection,
    unHoverSection
} from "../../actions/timetable_actions";
import {getSchoolSpecificInfo} from "../../constants/schools";
import {fetchCourseClassmates, hideExplorationModal, openSignUpModal, react} from "../../actions/modal_actions";

const mapStateToProps = (state) => {
    let {isVisible, advancedSearchResults, isFetching, active, page} = state.explorationModal;
    let courseSections = state.courseSections.objects;
    let course = advancedSearchResults[active];
    let inRoster = course && (courseSections[course.id] !== undefined);
    let activeTimetable = state.timetables.items[state.timetables.active];
    let {areas, departments, levels} = state.school;
    let semester = allSemesters[state.semesterIndex];
    return {
        isVisible,
        isFetching,
        advancedSearchResults,
        active,
        course,
        inRoster,
        areas,
        departments,
        levels,
        page,
        semesterName: semester.name + " " + semester.year,
        schoolSpecificInfo: getSchoolSpecificInfo(state.school.school),
        isLoggedIn: state.userInfo.data.isLoggedIn,
        hasHoveredResult: activeTimetable.courses.some(course => course.fake),
        classmates: state.courseInfo.classmates,
        isSectionLocked: (courseId, section) => {
            if (courseSections[courseId] === undefined) {
                return false;
            }
            return Object.keys(courseSections[courseId]).some(
                (type) => courseSections[courseId][type] == section
            )
        },
        isSectionOnActiveTimetable: (courseId, section) => {
            return activeTimetable.courses.some(
                course => course.id === courseId &&
                course.enrolled_sections.some(sec => sec == section)
            );
        },
    }
}

const ExplorationModalContainer = connect(
    mapStateToProps,
    {
        hideExplorationModal,
        openSignUpModal,
        fetchAdvancedSearchResults,
        fetchCourseClassmates,
        addOrRemoveOptionalCourse,
        hoverSection,
        unHoverSection,
        addOrRemoveCourse,
        react,
        paginate: paginateAdvancedSearchResults,
        clearPagination: clearAdvancedSearchPagination,
        setAdvancedSearchResultIndex
    }
)(ExplorationModal);

export default ExplorationModalContainer;
