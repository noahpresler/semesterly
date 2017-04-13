import {connect} from "react-redux";
import {fetchSearchResults, hoverSearchResult, maybeSetSemester} from "../../actions/search_actions";
import {addOrRemoveCourse, addOrRemoveOptionalCourse} from "../../actions/timetable_actions";
import {SearchBar} from "../search_bar";
import {fetchCourseInfo, showExplorationModal} from "../../actions/modal_actions";
import {getSchoolSpecificInfo} from "../../constants/schools";
import {openIntegrationModal} from "../../actions/user_actions";

const mapStateToProps = (state) => {
    let {isVisible} = state.explorationModal;
    let courseSections = state.courseSections.objects;
    let schoolSpecificInfo = getSchoolSpecificInfo(state.school.school);
    let schoolSpecificCampuses = schoolSpecificInfo.campuses;
    return {
        semester: allSemesters[state.semesterIndex],
        campuses: schoolSpecificCampuses,
        searchResults: state.searchResults.items,
        isFetching: state.searchResults.isFetching,
        isCourseInRoster: (course_id) => courseSections[course_id] !== undefined,
        isCourseOptional: (course_id) => state.optionalCourses.courses.some(c => c.id === course_id),
        hasHoveredResult: state.timetables.items[state.timetables.active].courses.some(course => course.fake),
        isHovered: (position) => state.ui.searchHover === position,
        hoveredPosition: state.ui.searchHover,
        explorationModalIsVisible: isVisible
    }
}

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
        maybeSetSemester
    }
)(SearchBar);

export default SearchBarContainer;
