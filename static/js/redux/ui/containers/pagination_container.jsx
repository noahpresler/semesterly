import { connect } from 'react-redux';
import Pagination from '../pagination';
import { setActiveTimetable } from '../../actions/timetable_actions';

const mapStateToProps = state => ({
  count: state.timetables.items.length,
  active: state.timetables.active,
});

const PaginationContainer = connect(
    mapStateToProps,
  {
    setActive: setActiveTimetable,
  },
)(Pagination);

export default PaginationContainer;
