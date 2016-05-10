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
		practicalSections: practicalSections
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		addCourse: addOrRemoveCourse,
		hideModal: () => dispatch(setCourseId(null))
	}
}

const CourseModalContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(CourseModal);

export default CourseModalContainer;
