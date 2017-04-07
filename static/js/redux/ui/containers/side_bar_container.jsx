import {connect} from "react-redux";
import SideBar from "../side_bar.jsx";
import {fetchCourseInfo, togglePeerModal, triggerTextbookModal, showFinalExamsModal} from "../../actions/modal_actions.jsx";
import {addOrRemoveCourse, addOrRemoveOptionalCourse, loadTimetable} from "../../actions/timetable_actions.jsx";
import {deleteTimetable, duplicateTimetable} from "../../actions/user_actions.jsx";
import * as ActionTypes from "../../constants/actionTypes.jsx";

const mapStateToProps = (state) => {
    let courseSections = state.courseSections.objects;
    let savingTimetable = state.savingTimetable;

    let activeTimetable = state.timetables.items[state.timetables.active];
    let mandatoryCourses = activeTimetable.courses.filter(c => !c.is_optional && !c.fake);
    let optionalCourses = state.optionalCourses.courses;

    return {
        semester: allSemesters[state.semesterIndex],
        semesterIndex: state.semesterIndex,
        liveTimetableCourses: activeTimetable.courses.filter(c => !c.fake), // don't want to consider courses that are shown on timetable only because of a 'HOVER_COURSE' action (i.e. fake courses)
        savedTimetables: state.userInfo.data.timetables,
        courseToColourIndex: state.ui.courseToColourIndex,
        classmates: state.classmates.courseToClassmates,
        avgRating: activeTimetable.avg_rating,
        isCourseInRoster: (course_id) => activeTimetable.courses.some(c => c.id === course_id),
        mandatoryCourses,
        optionalCourses,
    }
}

const SideBarContainer = connect(
    mapStateToProps,
    {
        fetchCourseInfo,
        removeCourse: addOrRemoveCourse,
        removeOptionalCourse: addOrRemoveOptionalCourse,
        launchPeerModal: togglePeerModal,
        launchTextbookModal: triggerTextbookModal,
        duplicateTimetable,
        deleteTimetable,
        launchFinalExamsModal: showFinalExamsModal,
        loadTimetable
    }
)(SideBar);

export default SideBarContainer;
