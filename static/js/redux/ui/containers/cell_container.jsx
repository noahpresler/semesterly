import { connect } from 'react-redux';
import Cell from '../calendar_cell';
import { addCustomSlot, updateCustomSlot } from '../../actions/timetable_actions';
import { getMaxEndHour } from '../../reducers/root_reducer';

const mapStateToProps = state => ({
  endHour: getMaxEndHour(state),
});

const CellContainer = connect(
    mapStateToProps,
  {
    addCustomSlot,
    updateCustomSlot,
  },
)(Cell);

export default CellContainer;
