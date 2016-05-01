import { connect } from 'react-redux';
import { CourseModal } from '../course_modal.jsx';
import { addOrRemoveCourse } from '../../actions/timetable_actions.jsx';
import { setCourseId } from '../../actions/modal_actions.jsx'

const mapStateToProps = (state) => {
	return {
		isFetching: state.courseInfo.isFetching,
		data: state.courseInfo.data,
		id: state.courseInfo.id,
		inRoster: state.courseSections[state.courseInfo.id] !== undefined
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
