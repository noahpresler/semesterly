import { connect } from 'react-redux';
import { fetchSearchResults } from '../../actions/search_actions.jsx';
import { fetchTimetables } from '../../actions/timetable_actions.jsx';
import { SearchBar } from '../search_bar.jsx';
import { fetchCourseInfo } from '../../actions/modal_actions.jsx'

const mapStateToProps = (state) => {
	return {
    	searchResults: state.searchResults.items,
    	isCourseInRoster: (course_id) => state.courseSections[course_id] !== undefined,
    	isSectionLocked: (course_id, section) => {
    		if (state.courseSections[course_id] === undefined) {
    			return false;
    		}
    		return Object.keys(state.courseSections[course_id]).some( 
    			(type) => state.courseSections[course_id][type] == section
			)
    	}
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
	  	fetchCourses: (query) => dispatch(fetchSearchResults(query)),
	  	addCourse: (course, section = '') => {
	  		course.section = section;
	  		dispatch(fetchTimetables(course));
	  	},
	  	hoverCourse: (course, section) => {
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
		fetchCourseInfo: (id) => dispatch(fetchCourseInfo(id))
	}
}

const SearchBarContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(SearchBar);

export default SearchBarContainer;
