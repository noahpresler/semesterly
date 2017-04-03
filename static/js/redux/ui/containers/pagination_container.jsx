import { connect } from 'react-redux';
import { Pagination } from '../pagination.jsx';
import { fetchCourseInfo } from '../../actions/modal_actions.jsx'
import { addOrRemoveCourse } from '../../actions/timetable_actions.jsx'
import { autoSave } from '../../actions/user_actions.jsx';
import * as ActionTypes from '../../constants/actionTypes.jsx'

const mapStateToProps = (state) => {
	return {
    	count: state.timetables.items.length,
    	active: state.timetables.active,
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		setActive: (newActive) => {
			dispatch( {type: ActionTypes.CHANGE_ACTIVE_TIMETABLE, newActive} );
			autoSave();
		},
	}
}

const PaginationContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(Pagination);

export default PaginationContainer;
