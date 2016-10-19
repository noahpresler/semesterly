import { connect } from 'react-redux';
import { fetchSearchResults, setSemesterWrapper } from '../../actions/search_actions.jsx';
import { addOrRemoveCourse, addOrRemoveOptionalCourse } from '../../actions/timetable_actions.jsx';
import { SearchBar } from '../search_bar.jsx';
import { fetchCourseInfo } from '../../actions/modal_actions.jsx';
import { getSchoolSpecificInfo } from '../../constants.jsx';

const mapStateToProps = (state) => {
	let { isVisible } = state.explorationModal;
	let courseSections = state.courseSections.objects;
	let schoolSpecificInfo = getSchoolSpecificInfo(state.school.school);
	let schoolSpecificSemesters = schoolSpecificInfo.semesters;
	let schoolSpecificCampuses = schoolSpecificInfo.campuses;
	return {
		semester: state.semester,
		semesterName: schoolSpecificSemesters[state.semester],
		getSemesterName: schoolSpecificSemesters,
		campuses: schoolSpecificCampuses,
		availableSemesters: ["F", "S"],
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
		// {
		//     type: "REQUEST_COURSE_INFO",
		//     course_id: course_id,
		//   }
		showIntegrationModal: (id) => dispatch({type: 'TOGGLE_INTEGRATION_MODAL', id: id}),
		hoverSearchResult: (position) => {
			dispatch({
				type: "HOVER_SEARCH_RESULT",
				position
			});
		},
		setSemester: setSemesterWrapper
	}
}

const SearchBarContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(SearchBar);

export default SearchBarContainer;
