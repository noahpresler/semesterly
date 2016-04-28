import { connect } from 'react-redux';
import { Calendar } from '../calendar.jsx';
import { fetchCourseInfo } from '../../actions/modal_actions.jsx'
import { fetchTimetables } from '../../actions/timetable_actions.jsx'

const mapStateToProps = (state) => {
	return {
    	items: state.timetables.items,
    	active: state.timetables.active,
    	isFetching: state.timetables.isFetching
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		setActive: (new_active) => dispatch({type: "CHANGE_ACTIVE_TIMETABLE", new_active}),
		fetchCourseInfo: (course) => dispatch(fetchCourseInfo(course)),
		removeCourse: (course_id) => {
	  		let course = {id: course_id}
	  		dispatch(fetchTimetables(course));
	  	},
	}
}

const CalendarContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(Calendar);

export default CalendarContainer;
