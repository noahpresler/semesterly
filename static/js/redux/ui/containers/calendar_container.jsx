import { connect } from 'react-redux';
import { Calendar } from '../calendar.jsx';
import { fetchCourseInfo } from '../../actions/modal_actions.jsx'
import { fetchTimetables } from '../../actions/timetable_actions.jsx'

const mapStateToProps = (state) => {
	return {
    	items: state.timetables.items,
    	active: state.timetables.active,
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		setActive: (new_active) => dispatch({type: "CHANGE_ACTIVE_TIMETABLE", new_active}),
	}
}

const CalendarContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(Calendar);

export default CalendarContainer;
