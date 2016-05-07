import { connect } from 'react-redux';
import { SearchSideBar } from '../search_side_bar.jsx';
import { addOrRemoveCourse } from '../../actions/timetable_actions.jsx';

const mapStateToProps = (state) => {
	let hovered = state.searchResults.items[state.ui.searchHover];
	let slots = hovered.slots;
	return {
		hovered: hovered,
		slots: slots,
		isSectionLocked: (course_id, section) => {
			if (state.courseSections.objects[course_id] === undefined) {
				return false;
			}
			return Object.keys(state.courseSections.objects[course_id]).some( 
				(type) => state.courseSections.objects[course_id][type] == section
			)
		}
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
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
		}
	}
}

const SearchSideBarContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(SearchSideBar);

export default SearchSideBarContainer;