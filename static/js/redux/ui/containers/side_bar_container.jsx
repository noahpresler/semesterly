import { connect } from 'react-redux';
import SideBar from '../side_bar.jsx';
import { saveTimetable } from '../../actions/user_actions.jsx'

const mapStateToProps = (state) => {
	return {
    	savingTimetable: state.savingTimetable.saving
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		saveTimetable: () => dispatch(saveTimetable()),
		changeName: (name) => dispatch({
			type: "CHANGE_TIMETABLE_NAME",
			name,
		}),
	}
}

const SideBarContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(SideBar);

export default SideBarContainer;
