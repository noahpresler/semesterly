import { connect } from 'react-redux';
import DTMSideBar from '../dtm_side_bar.jsx';
import { fetchCourseInfo } from '../../actions/modal_actions.jsx'
import { addOrRemoveCourse, loadTimetable, addOrRemoveOptionalCourse } from '../../actions/timetable_actions.jsx';
import { duplicateTimetable, deleteTimetable } from '../../actions/user_actions.jsx'
import { fetchShareAvailabilityLink } from '../../actions/dtm_actions.jsx'
import { getSchoolSpecificInfo } from '../../constants.jsx'

const mapStateToProps = (state) => {
	let courseSections = state.courseSections.objects;
	let savingTimetable = state.savingTimetable;

	let activeTimetable = state.timetables.items[state.timetables.active];
	let mandatoryCourses = activeTimetable.courses.filter(c => !c.is_optional && !c.fake);
	let optionalCourses = state.optionalCourses.courses;

	let { isFetchingShareLink, shareLink, shareLinkValid } = state.dtmShare;

	return {
		semester: state.semester,
		semesterName: getSchoolSpecificInfo(state.school.school).semesters[state.semester],
		liveTimetableCourses: activeTimetable.courses.filter(c => !c.fake), // don't want to consider courses that are shown on timetable only because of a 'HOVER_COURSE' action (i.e. fake courses)
		savedTimetables: state.userInfo.data.timetables,
		courseToColourIndex: state.ui.courseToColourIndex,
		classmates: state.classmates.courseToClassmates,
		avgRating: activeTimetable.avg_rating,
		isCourseInRoster: (course_id) => activeTimetable.courses.some(c => c.id === course_id),
		shareLinkDirty: state.dtmCalendars.dirty,
		mandatoryCourses,
		optionalCourses,
		isFetchingShareLink,
		shareLink,
		shareLinkValid,
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		fetchCourseInfo: (courseId) => dispatch(fetchCourseInfo(courseId)),
	    removeCourse: (courseId) => addOrRemoveCourse(courseId),
	    removeOptionalCourse: (course) => dispatch(addOrRemoveOptionalCourse(course)),
	    launchPeerModal: () => dispatch({type:'TOGGLE_PEER_MODAL'}),
	    launchTextbookModal: () => dispatch({type:'TRIGGER_TEXTBOOK_MODAL'}),
		duplicateTimetable: (tt) => dispatch(duplicateTimetable(tt)),
		deleteTimetable: (tt) => dispatch(deleteTimetable(tt)),
		fetchShareAvailabilityLink: () => dispatch(fetchShareAvailabilityLink()),
		loadTimetable
	}
}

const DTMSideBarContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(DTMSideBar);

export default DTMSideBarContainer;
