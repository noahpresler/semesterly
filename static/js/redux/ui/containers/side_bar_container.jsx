import { connect } from 'react-redux';
import SideBar from '../side_bar.jsx';
import { fetchCourseInfo } from '../../actions/modal_actions.jsx'
import { addOrRemoveCourse, loadTimetable } from '../../actions/timetable_actions.jsx';

const mapStateToProps = (state) => {
	let courseSections = state.courseSections.objects;
	let savingTimetable = state.savingTimetable;
	// don't pass fake courses as part of roster
	let activeTimetable = state.timetables.items[state.timetables.active];
	return {
		liveTimetableCourses: activeTimetable.courses.filter(c => !c.fake),
		savedTimetables: state.userInfo.data.timetables,
		courseToColourIndex: state.ui.courseToColourIndex,
		optionalCourses: state.optionalCourses.courses,
		classmates: state.classmates.courseToClassmates,
		isCourseInRoster: (course_id) => courseSections[course_id] !== undefined
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		fetchCourseInfo: (courseId) => dispatch(fetchCourseInfo(courseId)),
		loadTimetable,
        removeCourse: (courseId) => addOrRemoveCourse(courseId),
	}
}

const SideBarContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(SideBar);

export default SideBarContainer;
