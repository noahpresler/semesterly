import { connect } from 'react-redux';
import SideBar from '../side_bar.jsx';
import { loadTimetable } from '../../actions/timetable_actions.jsx';

const mapStateToProps = (state) => {
	return Object.assign({}, state.savingTimetable, {
		savedTimetables: state.userInfo.data.timetables,
	});
}

const mapDispatchToProps = (dispatch) => {
	return {
		changeName: (name) => {
			dispatch({
				type: "CHANGE_ACTIVE_SAVED_TIMETABLE_NAME",
				name,
			})
		},
		loadTimetable
	}
}

const SideBarContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(SideBar);

export default SideBarContainer;
