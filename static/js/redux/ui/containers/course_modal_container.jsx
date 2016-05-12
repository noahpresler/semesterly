import { connect } from 'react-redux';
import { CourseModal } from '../course_modal.jsx';
import { addOrRemoveCourse } from '../../actions/timetable_actions.jsx';
import { setCourseId } from '../../actions/modal_actions.jsx'

const mapStateToProps = (state) => {
	let lectureSections = [];
	let tutorialSections = [];
	let practicalSections = [];
	if (state.courseInfo.data.sections) {
		lectureSections = state.courseInfo.data.sections['L'];
		tutorialSections = state.courseInfo.data.sections['T'];
		practicalSections = state.courseInfo.data.sections['P'];
	}
	return {
		isFetching: state.courseInfo.isFetching,
		data: state.courseInfo.data,
		id: state.courseInfo.id,
		inRoster: state.courseSections.objects[state.courseInfo.id] !== undefined,
		lectureSections: lectureSections,
		tutorialSections: tutorialSections,
		practicalSections: practicalSections,
		hasHoveredResult: state.timetables.items[state.timetables.active].courses.some(course => course.fake)
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		addCourse: addOrRemoveCourse,
		hideModal: () => dispatch(setCourseId(null)),
		hoverCourse: (course, section) => {
	  		let availableSections = Object.assign({}, course.sections['L'], course.sections['T'], course.sections['P']);
	  		course.section = section;
			dispatch({
				type: "HOVER_COURSE",
				course: Object.assign({}, course, { slots: availableSections[section] })
			});
		},
		unhoverCourse: () => {
			dispatch({
				type: "UNHOVER_COURSE",
			});
		}
	}
}

const CourseModalContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(CourseModal);

export default CourseModalContainer;
