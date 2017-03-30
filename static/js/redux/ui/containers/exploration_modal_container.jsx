import { connect } from 'react-redux';
import { ExplorationModal } from '../exploration_modal.jsx';
import { fetchAdvancedSearchResults } from '../../actions/search_actions.jsx';
import { hoverSection, unhoverSection, addOrRemoveCourse, addOrRemoveOptionalCourse } from '../../actions/timetable_actions.jsx';
import { getSchoolSpecificInfo } from '../../constants.jsx';
import { react } from '../../actions/modal_actions.jsx';

const mapStateToProps = (state) => {
	let { isVisible, advancedSearchResults, isFetching, active, page} = state.explorationModal;
	let courseSections = state.courseSections.objects;
	let course = advancedSearchResults[active];
	let inRoster = course && (courseSections[course.id] !== undefined);
	let activeTimetable = state.timetables.items[state.timetables.active];
	let { areas, departments, levels } = state.school;
	let semester = allSemesters[state.semesterIndex];
	return {
		isVisible,
    isFetching,
		advancedSearchResults,
		active,
		course,
		inRoster,
		areas,
		departments,
		levels,
		page,
		semesterName: semester.name + " " + semester.year,
		schoolSpecificInfo: getSchoolSpecificInfo(state.school.school),
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
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		hideModal: () => dispatch({ type: "HIDE_EXPLORATION_MODAL" }),
		openSignupModal: () => dispatch({ type: "TOGGLE_SIGNUP_MODAL" }),
  	fetchAdvancedSearchResults: (query, filters) => dispatch(fetchAdvancedSearchResults(query, filters)),
  	paginate: () => dispatch({type: 'PAGINATE_ADVANCED_SEARCH_RESULTS'}),
  	clearPagination: () => dispatch({type: 'CLEAR_ADVANCED_SEARCH_PAGINATION'}),
  	setAdvancedSearchResultIndex: (i) => dispatch({ type: "SET_ACTIVE_RESULT", active: i }),
  	addOrRemoveOptionalCourse: (course) => dispatch(addOrRemoveOptionalCourse(course)),
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
