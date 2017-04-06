import {connect} from "react-redux";
import {ExplorationModal} from "../exploration_modal.jsx";
import {fetchAdvancedSearchResults} from "../../actions/search_actions.jsx";
import {
    addOrRemoveCourse,
    addOrRemoveOptionalCourse,
    hoverSection,
    unHoverSection
} from "../../actions/timetable_actions.jsx";
import {getSchoolSpecificInfo} from "../../constants/schools.jsx";
import {fetchCourseClassmates, react} from "../../actions/modal_actions.jsx";
import * as ActionTypes from "../../constants/actionTypes.jsx";

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
            return activeTimetable.courses.some(course => course.id === courseId && course.enrolled_sections.some(sec => sec == section));
        },
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        hideModal: () => dispatch({type: ActionTypes.HIDE_EXPLORATION_MODAL}),
        openSignupModal: () => dispatch({type: ActionTypes.TOGGLE_SIGNUP_MODAL}),
        fetchAdvancedSearchResults: (query, filters) => dispatch(fetchAdvancedSearchResults(query, filters)),
        paginate: () => dispatch({type: ActionTypes.PAGINATE_ADVANCED_SEARCH_RESULTS}),
        clearPagination: () => dispatch({type: ActionTypes.CLEAR_ADVANCED_SEARCH_PAGINATION}),
        setAdvancedSearchResultIndex: (idx, course_id) => {
            dispatch({type: ActionTypes.SET_ACTIVE_RESULT, active: idx});
            dispatch(fetchCourseClassmates(course_id));
        },
        fetchCourseClassmates: (cid) => dispatch(fetchCourseClassmates(cid)),
        addOrRemoveOptionalCourse: (course) => dispatch(addOrRemoveOptionalCourse(course)),
        hoverSection,
        unhoverSection: unHoverSection(dispatch),
        addOrRemoveCourse,
        react,
    }
}

const ExplorationModalContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(ExplorationModal);

export default ExplorationModalContainer;
