import { connect } from 'react-redux';
import { WeeklyPagination } from '../weekly_pagination.jsx';
import { fetchCourseInfo } from '../../actions/modal_actions.jsx'
import { addOrRemoveCourse } from '../../actions/timetable_actions.jsx'
import { autoSave } from '../../actions/user_actions.jsx';

const mapStateToProps = (state) => {
	return {
    	count: state.timetables.items.length,
    	active: state.timetables.active,
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		setActive: (newActive) => {
			dispatch( {type: "CHANGE_ACTIVE_TIMETABLE", newActive} );
			autoSave();
		},
	}
}

const WeeklyPaginationContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(WeeklyPagination);

export default WeeklyPaginationContainer;
