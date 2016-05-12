import { connect } from 'react-redux';
import { ExplorationModal } from '../exploration_modal.jsx';

const mapStateToProps = (state) => {
	return {
		isVisible: state.explorationModal.isVisible,
		course: state.timetables.items[state.timetables.active].courses[0]
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		toggleExplorationModal: () => {dispatch({type: "TOGGLE_EXPLORATION_MODAL"})}
	}
}

const ExplorationModalContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(ExplorationModal);

export default ExplorationModalContainer;
