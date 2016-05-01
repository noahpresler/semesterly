import { connect } from 'react-redux';
import { fetchCourseInfo } from '../../actions/modal_actions.jsx'
import { addOrRemoveCourse } from '../../actions/timetable_actions.jsx'
import { getPrimaryDisplay } from '../../constants.jsx';
import SlotManager from '../slot.jsx';

const mapStateToProps = (state) => {
	let activeTimetable = state.timetables.items[state.timetables.active];
	return {
		timetable: activeTimetable || [],
		isLocked: (courseId, section) => {
			// check the courseSections state variable, which tells us
			// precisely which courses have which sections locked, if any
	        let typeToLocked = state.courseSections.objects[courseId]
			for (let sectionType in typeToLocked) {
                if (section == typeToLocked[sectionType]) {
                    return true;
                }
	        }
	        // couldn't find a match, so the course isn't locked for this section
			return false;
		},
		primaryDisplayAttribute: getPrimaryDisplay(state.school)
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		fetchCourseInfo: (courseId) => dispatch(fetchCourseInfo(courseId)),
		addOrRemoveCourse: addOrRemoveCourse
	}
}

const SlotManagerContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(SlotManager);

export default SlotManagerContainer;
