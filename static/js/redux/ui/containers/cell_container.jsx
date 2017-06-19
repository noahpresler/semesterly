import { connect } from 'react-redux';
import Cell from '../calendar_cell';
import { getActiveTT } from '../../reducers/root_reducer';
import { addCustomSlot, updateCustomSlot } from '../../actions/timetable_actions';
import { getMaxEndHour } from '../../util';

const mapStateToProps = (state) => {
  const hasTimetables = getActiveTT(state).courses.length > 0;
  return {
    endHour: getMaxEndHour(getActiveTT(state), hasTimetables),
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
