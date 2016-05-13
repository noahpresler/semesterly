import { connect } from 'react-redux';
import { ExplorationModal } from '../exploration_modal.jsx';
import { fetchAdvancedSearchResults } from '../../actions/search_actions.jsx';
import { hoverSection, unhoverSection, addOrRemoveCourse } from '../../actions/timetable_actions.jsx';

const mapStateToProps = (state) => {
	let { isVisible, advancedSearchResults, isFetching, active } = state.explorationModal;
	return {
		isVisible,
    	isFetching,
		advancedSearchResults,
		active,
		course: advancedSearchResults[active],
		hasHoveredResult: state.timetables.items[state.timetables.active].courses.some(course => course.fake),
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		toggleExplorationModal: () => dispatch({type: "TOGGLE_EXPLORATION_MODAL"}),
	  	fetchAdvancedSearchResults: (query) => dispatch(fetchAdvancedSearchResults(query)),
	  	setAdvancedSearchResultIndex: (i) => dispatch({ type: "SET_ACTIVE_RESULT", active: i }),
		hoverSection: hoverSection(dispatch),
		unhoverSection: unhoverSection(dispatch)
	}
}

const ExplorationModalContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(ExplorationModal);

export default ExplorationModalContainer;
