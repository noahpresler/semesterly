import { connect } from 'react-redux';
import SideBar from '../side_bar.jsx';
import { lockActiveSections } from '../../actions/user_actions.jsx';

const mapStateToProps = (state) => {
	return Object.assign({}, state.savingTimetable, {
		savedTimetables: state.userInfo.data.timetables,
	});
}

const mapDispatchToProps = (dispatch) => {
	return {
		changeName: (name) => {},
		loadTimetable: (timetable) => {
			dispatch({
				type: "CHANGE_ACTIVE_SAVED_TIMETABLE",
				timetable,
			});
			dispatch({
				type: "RECEIVE_TIMETABLES",
				timetables: [timetable],
				preset: true
			});
			dispatch({
				type: "RECEIVE_COURSE_SECTIONS",
				courseSections: lockActiveSections(timetable)
			});
		}
	}
}

const SideBarContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(SideBar);

export default SideBarContainer;
