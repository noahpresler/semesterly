import { connect } from 'react-redux';
import { ExplorationModal } from '../exploration_modal.jsx';
import { fetchAdvancedSearchResults } from '../../actions/search_actions.jsx';
import { hoverSection, unhoverSection, addOrRemoveCourse } from '../../actions/timetable_actions.jsx';

const mapStateToProps = (state) => {
	let { isVisible, advancedSearchResults, isFetching, active } = state.explorationModal;
	let courseSections = state.courseSections.objects;
	let course = advancedSearchResults[active];
	let inRoster = false;
	if (course) {
		inRoster = courseSections[course.id] !== undefined
	}
	return {
		isVisible,
    	isFetching,
		advancedSearchResults,
		active,
		course,
		inRoster,
		hasHoveredResult: state.timetables.items[state.timetables.active].courses.some(course => course.fake),
		isSectionLocked: (courseId, section) => {
			if (courseSections[courseId] === undefined) {
				return false;
			}
			return Object.keys(courseSections[courseId]).some( 
				(type) => courseSections[courseId][type] == section
			)
		},
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		toggleExplorationModal: () => dispatch({ type: "TOGGLE_EXPLORATION_MODAL" }),
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
