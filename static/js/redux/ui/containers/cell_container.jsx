import { connect } from 'react-redux';
import Cell from '../calendar_cell.jsx';
import { addCustomSlot, moveCustomSlot, removeCustomSlot } from '../../actions/timetable_actions.jsx';


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
  let hasTimetables = timetables[active].courses.length > 0 
  return {
      endHour: getMaxEndHour(timetables[active], hasTimetables),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    addCustomSlot: addCustomSlot,
    moveCustomSlot: moveCustomSlot
  }
}

const CellContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Cell);

export default CellContainer;
