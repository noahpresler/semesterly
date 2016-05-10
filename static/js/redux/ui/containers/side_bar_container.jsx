import { connect } from 'react-redux';
import SideBar from '../side_bar.jsx';
import { saveTimetable, lockActiveSections } from '../../actions/user_actions.jsx'

const mapStateToProps = (state) => {
	return Object.assign({}, state.savingTimetable, {
		savedTimetables: state.userInfo.data.timetables
	});
}

const mapDispatchToProps = (dispatch) => {
	return {
		saveTimetable: () => dispatch(saveTimetable()),
		changeName: (name) => dispatch({
			type: "CHANGE_TIMETABLE_NAME",
			name,
		}),
		loadTimetable: (timetable) => {
			dispatch({
				type: "RECEIVE_TIMETABLES",
				timetables: [timetable]
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
