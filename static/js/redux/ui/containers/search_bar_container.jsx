import { connect } from 'react-redux';
import { fetchSearchResults } from '../../actions/search_actions.jsx';
import { fetchTimetables } from '../../actions/timetable_actions.jsx';
import { SearchBar } from '../search_bar.jsx';
const mapStateToProps = (state) => {
	return {
    	searchResults: state.searchResults.items
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
  	fetchCourses: (query) => dispatch(fetchSearchResults(query)),
  	addCourse: (course) => dispatch(fetchTimetables(course)),
  	hoverCourse: (course, section) => {
			dispatch({
  			type: "HOVER_COURSE",
  			course: Object.assign({}, course, {slots: course.slots[section]})
			});

	  },
	  unhoverCourse: () => {
			dispatch({
  			type: "UNHOVER_COURSE",
			});
	  }
	}
}

const SearchBarContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(SearchBar);

export default SearchBarContainer;
