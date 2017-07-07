import { connect } from 'react-redux';
import Pagination from '../pagination';
import { getTimetables } from '../../reducers/root_reducer';
import { setActiveTimetable } from '../../actions/timetable_actions';

const mapStateToProps = state => ({
  count: getTimetables(state).length,
  active: state.timetables.active,
});

const PaginationContainer = connect(
    mapStateToProps,
  {
    setActive: setActiveTimetable,
  },
)(Pagination);

export default PaginationContainer;
