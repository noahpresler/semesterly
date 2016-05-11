import { connect } from 'react-redux';
import { fetchSearchResults } from '../../actions/search_actions.jsx';
import { addOrRemoveCourse } from '../../actions/timetable_actions.jsx';
import { SearchBar } from '../search_bar.jsx';
import { fetchCourseInfo } from '../../actions/modal_actions.jsx'

const mapStateToProps = (state) => {
	let courseSections = state.courseSections.objects;
	return {
		semester: state.semester,
		availableSemesters: ["F", "S"],
    	searchResults: state.searchResults.items,
    	isFetching: state.searchResults.isFetching,
    	isCourseInRoster: (course_id) => courseSections[course_id] !== undefined,
    	isCourseOptional: (course_id) => state.optionalCourses.ids.indexOf(course_id) !== -1,
    	isSectionLocked: (course_id, section) => {
    		if (courseSections[course_id] === undefined) {
    			return false;
    		}
    		return Object.keys(courseSections[course_id]).some( 
    			(type) => courseSections[course_id][type] == section
			)
    	},
		hasHoveredResult: state.timetables.items[state.timetables.active].courses.some(course => course.fake)
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
	  	fetchCourses: (query) => dispatch(fetchSearchResults(query)),
	  	addCourse: addOrRemoveCourse,
	  	addRemoveOptionalCourse: (id) => dispatch({
	  		type: "ADD_REMOVE_OPTIONAL_COURSE",
	  		newCourseId: id
	  	}),
		fetchCourseInfo: (id) => dispatch(fetchCourseInfo(id)), 
		toggleExplorationModal: () => {dispatch({type: "TOGGLE_EXPLORATION_MODAL"})},
		hoverSearchResult: (position) => {
			dispatch({
				type: "HOVER_SEARCH_RESULT",
				position
			});
		},
		setSemester: (semester) => {
			dispatch({
				type: "SET_SEMESTER",
				semester
			})
		}
	}
}

const SearchBarContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(SearchBar);

export default SearchBarContainer;
