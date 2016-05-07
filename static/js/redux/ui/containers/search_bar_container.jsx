import { connect } from 'react-redux';
import { fetchSearchResults } from '../../actions/search_actions.jsx';
import { addOrRemoveCourse } from '../../actions/timetable_actions.jsx';
import { SearchBar } from '../search_bar.jsx';
import { fetchCourseInfo } from '../../actions/modal_actions.jsx'

const mapStateToProps = (state) => {
	return {
    	searchResults: state.searchResults.items,
    	isFetching: state.searchResults.isFetching,
    	isCourseInRoster: (course_id) => state.courseSections.objects[course_id] !== undefined,
    	isSectionLocked: (course_id, section) => {
    		if (state.courseSections.objects[course_id] === undefined) {
    			return false;
    		}
    		return Object.keys(state.courseSections.objects[course_id]).some( 
    			(type) => state.courseSections.objects[course_id][type] == section
			)
    	},
		hasHoveredResult: state.timetables.items[state.timetables.active].courses.some(course => course.fake)
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
	  	fetchCourses: (query) => dispatch(fetchSearchResults(query)),
	  	addCourse: addOrRemoveCourse,
	  	hoverCourse: (course, section) => {
	  		course.section = section;
			dispatch({
				type: "HOVER_COURSE",
				course: Object.assign({}, course, { slots: course.slots[section] })
			});

		},
		unhoverCourse: () => {
			dispatch({
				type: "UNHOVER_COURSE",
			});
		},
		fetchCourseInfo: (id) => dispatch(fetchCourseInfo(id)), 
		hoverSearchResult: (pos) => {
			dispatch({
				type: "HOVER_SEARCH_RESULT",
				position: pos
			});
		}
	}
}

const SearchBarContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(SearchBar);

export default SearchBarContainer;
