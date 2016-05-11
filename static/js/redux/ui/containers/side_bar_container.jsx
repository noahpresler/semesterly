import { connect } from 'react-redux';
import SideBar from '../side_bar.jsx';
import { loadTimetable } from '../../actions/timetable_actions.jsx';
import { saveTimetable } from '../../actions/user_actions.jsx';
import { MAX_TIMETABLE_NAME_LENGTH } from '../../constants.jsx';

const mapStateToProps = (state) => {
	let savingTimetable = state.savingTimetable;
	// don't pass fake courses as part of roster
	let activeTimetable = state.timetables.items[state.timetables.active];
	return { 
		activeLoadedTimetable: savingTimetable.activeTimetable, // the user's saved timetable object that they are currently editing
		liveTimetableCourses: activeTimetable.courses.filter(c => !c.fake),
		saving: savingTimetable.saving, 
		upToDate: savingTimetable.upToDate,
		savedTimetables: state.userInfo.data.timetables,
		courseToColourIndex: state.ui.courseToColourIndex
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		changeTimetableName: (name) => {
			if (name.length === 0 || name.length > MAX_TIMETABLE_NAME_LENGTH) { return; }
			dispatch({
				type: "CHANGE_ACTIVE_SAVED_TIMETABLE_NAME",
				name,
			})
			dispatch(saveTimetable());
		},
		loadTimetable
	}
}

const SideBarContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(SideBar);

export default SideBarContainer;
