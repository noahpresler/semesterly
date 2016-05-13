import { connect } from 'react-redux';
import { CourseModal } from '../course_modal.jsx';
import { hoverSection, unhoverSection, addOrRemoveCourse } from '../../actions/timetable_actions.jsx';
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
	let courseSections = state.courseSections.objects;
	return {
		isFetching: state.courseInfo.isFetching,
		data: state.courseInfo.data,
		id: state.courseInfo.id,
		lectureSections: lectureSections,
		tutorialSections: tutorialSections,
		practicalSections: practicalSections,
		hasHoveredResult: state.timetables.items[state.timetables.active].courses.some(course => course.fake),
		prerequisites: state.courseInfo.data.prerequisites,
		description: state.courseInfo.data.description,
		inRoster: courseSections[state.courseInfo.id] !== undefined,
		isSectionLocked: (course_id, section) => {
			if (courseSections[course_id] === undefined) {
				return false;
			}
			return Object.keys(courseSections[course_id]).some( 
				(type) => courseSections[course_id][type] == section
			)
		},
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		hideModal: () => dispatch(setCourseId(null)),
		hoverSection: hoverSection(dispatch),
		unhoverSection: unhoverSection(dispatch),
		addOrRemoveCourse,
	}
}

const CourseModalContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(CourseModal);

export default CourseModalContainer;
