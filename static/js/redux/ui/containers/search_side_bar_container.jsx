import { connect } from 'react-redux';
import { SearchSideBar } from '../search_side_bar.jsx';
import { addOrRemoveCourse } from '../../actions/timetable_actions.jsx';

const mapStateToProps = (state) => {
	let courseSections = state.courseSections.objects;
	let hovered = state.searchResults.items[state.ui.searchHover];
	let sectionTypeToSections = hovered.sections;
	let lectureSections = sectionTypeToSections['L'];
	let tutorialSections = sectionTypeToSections['T'];
	let practicalSections = sectionTypeToSections['P'];

	return {
		hovered,
		lectureSections,
		tutorialSections,
		practicalSections,
		isSectionLocked: (course_id, section) => {
			if (courseSections[course_id] === undefined) {
				return false;
			}
			return Object.keys(courseSections[course_id]).some( 
				(type) => courseSections[course_id][type] == section
			)
		},
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
	  	addCourse: addOrRemoveCourse,
	  	hoverCourse: (course, section) => {
	  		let availableSections = Object.assign({}, course.sections['L'], course.sections['T'], course.sections['P']);
	  		course.section = section;
			dispatch({
				type: "HOVER_COURSE",
				course: Object.assign({}, course, { slots: availableSections[section] })
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
