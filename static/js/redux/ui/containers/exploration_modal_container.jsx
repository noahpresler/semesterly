import { connect } from 'react-redux';
import { ExplorationModal } from '../exploration_modal.jsx';
import { fetchAdvancedSearchResults } from '../../actions/search_actions.jsx';
import { hoverSection, unhoverSection, addOrRemoveCourse } from '../../actions/timetable_actions.jsx';
import { react } from '../../actions/modal_actions.jsx';

const mapStateToProps = (state) => {
	let { isVisible, advancedSearchResults, isFetching, active } = state.explorationModal;
	let courseSections = state.courseSections.objects;
	let course = advancedSearchResults[active];
	let inRoster = false;
	if (course) {
		inRoster = courseSections[course.id] !== undefined
	}
	let activeTimetable = state.timetables.items[state.timetables.active];
	return {
		isVisible,
    	isFetching,
		advancedSearchResults,
		active,
		course,
		inRoster,
		isLoggedIn: state.userInfo.data.isLoggedIn,
		hasHoveredResult: activeTimetable.courses.some(course => course.fake),
		isSectionLocked: (courseId, section) => {
			if (courseSections[courseId] === undefined) {
				return false;
			}
			return Object.keys(courseSections[courseId]).some( 
				(type) => courseSections[courseId][type] == section
			)
		},
		isSectionOnActiveTimetable: (courseId, section) => {
			return activeTimetable.courses.some(course => course.id === courseId && course.enrolled_sections.some(sec => sec == section));
		},
		areas: state.school.areas,
		departments: ["CSC", "MAT", "GGR", "ESS", "ANT", "PHY", "PSY", "GEO", "INI", "VIC", "STA", "ENG", "GER"],
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		hideModal: () => dispatch({ type: "HIDE_EXPLORATION_MODAL" }),
		openSignupModal: () => dispatch({ type: "TOGGLE_SIGNUP_MODAL" }),
	  	fetchAdvancedSearchResults: (query) => dispatch(fetchAdvancedSearchResults(query)),
	  	setAdvancedSearchResultIndex: (i) => dispatch({ type: "SET_ACTIVE_RESULT", active: i }),
		hoverSection: hoverSection(dispatch),
		unhoverSection: unhoverSection(dispatch),
		addOrRemoveCourse,
		react,
	}
}

const ExplorationModalContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(ExplorationModal);

export default ExplorationModalContainer;
