import { connect } from 'react-redux';
import Cell from '../calendar_cell';
import { addCustomSlot, updateCustomSlot } from '../../actions/timetable_actions';


/*
 gets the end hour of the current timetable, based on the class that ends latest
 */
const getMaxEndHour = (timetable, hasCourses) => {
  let maxEndHour = 17;
  if (!hasCourses) {
    return maxEndHour;
  }

  const courses = timetable.courses;
  Object.keys(courses).forEach((courseIndex) => {
    const course = courses[courseIndex];
    Object.keys(course.slots).forEach((slotIndex) => {
      const slot = course.slots[slotIndex];
      const endHour = parseInt(slot.time_end.split(':')[0], 10);
      maxEndHour = Math.max(maxEndHour, endHour);
    });
  });
  return maxEndHour;
};

const mapStateToProps = (state) => {
  const timetables = state.timetables.items;
  const active = state.timetables.active;
  const hasTimetables = timetables[active].courses.length > 0;
  return {
    endHour: getMaxEndHour(timetables[active], hasTimetables),
  };
};

const CellContainer = connect(
    mapStateToProps,
  {
    addCustomSlot,
    updateCustomSlot,
  },
)(Cell);

export default CellContainer;
