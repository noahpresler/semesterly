import { connect } from 'react-redux';
import Semesterly from '../semesterly.jsx';
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';
import { autoSave, saveTimetable } from '../../actions/user_actions.jsx';

const mapStateToProps = (state) => {
	let timetables = state.timetables.items;
	let active = state.timetables.active;
	let active_tt_length = timetables[active].courses.length;
	return {
    	alertConflict: state.alerts.alertConflict,
    	alertEnableNotifications: state.alerts.alertEnableNotifications,
    	alertTimetableExists: state.alerts.alertTimetableExists,
    	alertChangeSemester: state.alerts.alertChangeSemester,
    	alertNewTimetable: state.alerts.alertNewTimetable,
    	alertFacebookFriends: state.alerts.alertFacebookFriends 
    	&& state.userInfo.data.FacebookSignedUp 
    	&& !state.userInfo.data.social_courses 
    	&& !state.userInfo.overrideShow 
    	&& state.alerts.mostFriendsCount >= 1
    	&& active_tt_length >= 1,
    	explorationModalIsVisible: state.explorationModal.isVisible,
		PgCount: state.timetables.items.length,
    	PgActive: state.timetables.active,
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		saveTimetable: () => dispatch(saveTimetable()),
		setPgActive: (newActive) => {
			dispatch( {type: "CHANGE_ACTIVE_TIMETABLE", newActive} );
			autoSave();
		},
	}
}

const SemesterlyContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(Semesterly);

export default DragDropContext(HTML5Backend)(SemesterlyContainer);
// export default SemesterlyContainer