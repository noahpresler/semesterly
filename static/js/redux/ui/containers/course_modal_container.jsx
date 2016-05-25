import { connect } from 'react-redux';
import { CourseModal } from '../course_modal.jsx';
import { hoverSection, unhoverSection, addOrRemoveCourse, addOrRemoveOptionalCourse } from '../../actions/timetable_actions.jsx';
import { setCourseId, react, fetchCourseInfo } from '../../actions/modal_actions.jsx';

const mapStateToProps = (state) => {
	let lectureSections = [];
	let tutorialSections = [];
	let practicalSections = [];
	if (state.courseInfo.data.sections) {
		lectureSections = state.courseInfo.data.sections['L'];
		tutorialSections = state.courseInfo.data.sections['T'];
		practicalSections = state.courseInfo.data.sections['P'];
	}
	let courseSections = state.courseSections.objects;
	let activeTimetable = state.timetables.items[state.timetables.active];
	return {
		isFetching: state.courseInfo.isFetching,
		data: state.courseInfo.data,
		id: state.courseInfo.id,
		lectureSections: lectureSections,
		tutorialSections: tutorialSections,
		practicalSections: practicalSections,
		hasHoveredResult: activeTimetable.courses.some(course => course.fake),
		prerequisites: state.courseInfo.data.prerequisites,
		description: state.courseInfo.data.description,
		inRoster: courseSections[state.courseInfo.id] !== undefined,
		isLoggedIn: state.userInfo.data.isLoggedIn,
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
		hideModal: () => dispatch(setCourseId(null)),
		openSignupModal: () => dispatch({type: 'TOGGLE_SIGNUP_MODAL'}),
		fetchCourseInfo: (courseId) => dispatch(fetchCourseInfo(courseId)),
		hoverSection: hoverSection(dispatch),
		unhoverSection: unhoverSection(dispatch),
		addRemoveOptionalCourse: (course) => dispatch(addOrRemoveOptionalCourse(course)),
		addOrRemoveCourse,
		react,
	}
}

const CourseModalContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(CourseModal);

export default CourseModalContainer;
