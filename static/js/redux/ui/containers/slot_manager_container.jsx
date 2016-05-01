import { connect } from 'react-redux';
import { fetchCourseInfo } from '../../actions/modal_actions.jsx'
import { fetchTimetables } from '../../actions/timetable_actions.jsx'
import SlotManager from '../slot.jsx';

const mapStateToProps = (state) => {
	return {
		timetable: state.timetables.items[state.timetables.active] || [],
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		fetchCourseInfo: (course) => dispatch(fetchCourseInfo(course)),
		removeCourse: (course_id) => {
	  		let course = { id: course_id }
	  		dispatch(fetchTimetables(course));
	  	},
	}
}

const SlotManagerContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(SlotManager);

export default SlotManagerContainer;
