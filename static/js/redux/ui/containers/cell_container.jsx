import { connect } from 'react-redux';
import Cell from '../calendar_cell.jsx';
import { addCustomSlot, moveCustomSlot } from '../../actions/timetable_actions.jsx';

const mapStateToProps = (state) => { 
  return {}
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
