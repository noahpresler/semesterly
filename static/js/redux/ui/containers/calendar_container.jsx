import { connect } from 'react-redux';
import { Calendar } from '../calendar.jsx';

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
	}
}

const CalendarContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(Calendar);

export default CalendarContainer;
