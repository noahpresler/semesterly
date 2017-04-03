import { connect } from 'react-redux';
import SideBar from '../side_bar.jsx';
import { fetchCourseInfo } from '../../actions/modal_actions.jsx'
import { addOrRemoveCourse, loadTimetable, addOrRemoveOptionalCourse } from '../../actions/timetable_actions.jsx';
import { duplicateTimetable, deleteTimetable } from '../../actions/user_actions.jsx'
import { getSchoolSpecificInfo } from '../../constants/constants.jsx'
import * as ActionTypes from '../../constants/actionTypes.jsx'

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

const mapDispatchToProps = (dispatch) => {
	return {
		fetchCourseInfo: (courseId) => dispatch(fetchCourseInfo(courseId)),
	    removeCourse: (courseId) => addOrRemoveCourse(courseId),
	    removeOptionalCourse: (course) => dispatch(addOrRemoveOptionalCourse(course)),
	    launchPeerModal: () => dispatch({type: ActionTypes.TOGGLE_PEER_MODAL}),
	    launchTextbookModal: () => dispatch({type: ActionTypes.TRIGGER_TEXTBOOK_MODAL}),
		duplicateTimetable: (tt) => dispatch(duplicateTimetable(tt)),
		deleteTimetable: (tt) => dispatch(deleteTimetable(tt)),
		launchFinalExamsModal: () => dispatch({type: ActionTypes.SHOW_FINAL_EXAMS_MODAL}),
		loadTimetable
	}
}

const SideBarContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(SideBar);

export default SideBarContainer;
