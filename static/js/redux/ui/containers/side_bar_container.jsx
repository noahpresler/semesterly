import { connect } from 'react-redux';
import SideBar from '../side_bar.jsx';
import { fetchCourseInfo } from '../../actions/modal_actions.jsx'
import { addOrRemoveCourse, loadTimetable, addOrRemoveOptionalCourse } from '../../actions/timetable_actions.jsx';
import { getSchoolSpecificInfo } from '../../constants.jsx'

const mapStateToProps = (state) => {
	let courseSections = state.courseSections.objects;
	let savingTimetable = state.savingTimetable;
	// don't pass fake courses as part of roster
	let activeTimetable = state.timetables.items[state.timetables.active];
	return {
		semester: state.semester,
		semesterName: getSchoolSpecificInfo(state.school.school).semesters[state.semester],
		liveTimetableCourses: activeTimetable.courses.filter(c => !c.fake),
		savedTimetables: state.userInfo.data.timetables,
		courseToColourIndex: state.ui.courseToColourIndex,
		optionalCourses: state.optionalCourses.courses,
		classmates: state.classmates.courseToClassmates,
		avgRating: activeTimetable.avg_rating,
		isCourseInRoster: (course_id) => activeTimetable.courses.some(c => c.id === course_id)
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		fetchCourseInfo: (courseId) => dispatch(fetchCourseInfo(courseId)),
        removeCourse: (courseId) => addOrRemoveCourse(courseId),
        removeOptionalCourse: (course) => dispatch(addOrRemoveOptionalCourse(course)),
		loadTimetable,
	}
}

const SideBarContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(SideBar);

export default SideBarContainer;
