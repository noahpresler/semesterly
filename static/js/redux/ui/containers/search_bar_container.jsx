import { connect } from 'react-redux';
import { fetchSearchResults, maybeSetSemester } from '../../actions/search_actions.jsx';
import { addOrRemoveCourse, addOrRemoveOptionalCourse } from '../../actions/timetable_actions.jsx';
import { SearchBar } from '../search_bar.jsx';
import { fetchCourseInfo } from '../../actions/modal_actions.jsx';
import { getSchoolSpecificInfo } from '../../constants.jsx';
import { openIntegrationModal } from '../../actions/user_actions.jsx';

const mapStateToProps = (state) => {
	let { isVisible } = state.explorationModal;
	let courseSections = state.courseSections.objects;
	let schoolSpecificInfo = getSchoolSpecificInfo(state.school.school);
	let schoolSpecificCampuses = schoolSpecificInfo.campuses;
	return {
		semester: allSemesters[state.semesterIndex],
		campuses: schoolSpecificCampuses,
  	searchResults: state.searchResults.items,
  	isFetching: state.searchResults.isFetching,
  	isCourseInRoster: (course_id) => courseSections[course_id] !== undefined,
  	isCourseOptional: (course_id) => state.optionalCourses.courses.some(c => c.id === course_id),
		hasHoveredResult: state.timetables.items[state.timetables.active].courses.some(course => course.fake),
		isHovered: (position) => state.ui.searchHover === position,
		hoveredPosition: state.ui.searchHover,
		explorationModalIsVisible: isVisible
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
  	fetchCourses: (query) => dispatch(fetchSearchResults(query)),
  	addCourse: addOrRemoveCourse,
  	addRemoveOptionalCourse: (course) => dispatch(addOrRemoveOptionalCourse(course)),
		fetchCourseInfo: (id) => dispatch(fetchCourseInfo(id)), 
		showExplorationModal: () => dispatch({type: 'SHOW_EXPLORATION_MODAL'}),
		showIntegrationModal: (id, integrationID) => openIntegrationModal(integrationID, id),
		hoverSearchResult: (position) => {
			dispatch({
				type: "HOVER_SEARCH_RESULT",
				position
			});
		},
		maybeSetSemester
	}
}

const SearchBarContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(SearchBar);

export default SearchBarContainer;
