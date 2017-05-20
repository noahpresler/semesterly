import { connect } from 'react-redux';
import Cell from '../calendar_cell';
import { addCustomSlot, updateCustomSlot } from '../../actions/timetable_actions';
import { getMaxEndHour } from '../../util';

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
