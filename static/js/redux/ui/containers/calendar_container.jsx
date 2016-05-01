import { connect } from 'react-redux';
import { Calendar } from '../calendar.jsx';
import { fetchCourseInfo } from '../../actions/modal_actions.jsx'
import { addOrRemoveCourse } from '../../actions/timetable_actions.jsx'

const mapStateToProps = (state) => {
	return {
    	items: state.timetables.items,
    	active: state.timetables.active,
    	isFetching: state.timetables.isFetching		
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		setActive: (newActive) => dispatch( {type: "CHANGE_ACTIVE_TIMETABLE", newActive} ),
	}
}

const CalendarContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(Calendar);

export default CalendarContainer;
