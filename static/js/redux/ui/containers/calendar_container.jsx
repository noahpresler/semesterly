import { connect } from 'react-redux';
import { Calendar } from '../calendar.jsx';

const mapStateToProps = (state) => {
	return {
    	timetables: state.timetables.items
	}
}

const CalendarContainer = connect(
	mapStateToProps
)(Calendar);

export default CalendarContainer;
