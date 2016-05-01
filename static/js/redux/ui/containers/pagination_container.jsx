import { connect } from 'react-redux';
import { Pagination } from '../pagination.jsx';
import { fetchCourseInfo } from '../../actions/modal_actions.jsx'
import { addOrRemoveCourse } from '../../actions/timetable_actions.jsx'

const mapStateToProps = (state) => {
	return {
    	count: state.timetables.items.length,
    	active: state.timetables.active,
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		setActive: (newActive) => dispatch( {type: "CHANGE_ACTIVE_TIMETABLE", newActive} ),
	}
}

const PaginationContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(Pagination);

export default PaginationContainer;
