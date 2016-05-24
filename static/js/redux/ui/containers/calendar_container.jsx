import { connect } from 'react-redux';
import Calendar from '../calendar.jsx';
import { saveTimetable } from '../../actions/user_actions.jsx';
import { loadTimetable } from '../../actions/timetable_actions.jsx';
import { fetchShareTimetableLink } from '../../actions/calendar_actions.jsx';
/*
gets the end hour of the current timetable, based on the class that ends latest
*/
const getMaxEndHour = (timetable, hasCourses) => {
    let max_end_hour = 17;
    if (!hasCourses) {
      return max_end_hour;
    }

    let courses = timetable.courses;
    for (let course_index in courses) {
      let course = courses[course_index];
      for (let slot_index in course.slots) {
        let slot = course.slots[slot_index];
        let end_hour = parseInt(slot.time_end.split(":")[0]);
        max_end_hour = Math.max(max_end_hour, end_hour);
      }
    }
    return max_end_hour;

}
const mapStateToProps = (state) => {
	let timetables = state.timetables.items;
	let active = state.timetables.active;
	let hasTimetables = timetables[active].courses.length > 0;
  let { isFetchingShareLink, shareLink, shareLinkValid } = state.calendar;
	return {
    	endHour: getMaxEndHour(timetables[active], hasTimetables),
      saving: state.savingTimetable.saving,
      isFetchingShareLink,
      shareLink,
      shareLinkValid,
	}
}
const mapDispatchToProps = (dispatch) => {
  return {
    saveTimetable: () => dispatch(saveTimetable()),
    fetchShareTimetableLink: () => dispatch(fetchShareTimetableLink()),
    createTimetable: () => {
      loadTimetable({ name: "Untitled Schedule", courses: [] }, true);
    }
  }
}

const CalendarContainer = connect(
	mapStateToProps,
  mapDispatchToProps
)(Calendar);

export default CalendarContainer;
