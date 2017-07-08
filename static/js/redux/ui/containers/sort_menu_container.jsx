import { connect } from 'react-redux';
import SortMenu from '../sort_menu';
import {
    addMetric,
    changeMetric,
    removeMetric,
    toggleMetricOrder,
} from '../../actions/timetable_actions';

const mapStateToProps = state => ({
  metrics: state.preferences.sort_metrics,
});

const SortMenuContainer = connect(
    mapStateToProps,
  {
    addMetric,
    removeMetric,
    changeMetric,
    toggleMetricOrder,
  },
)(SortMenu);

export default SortMenuContainer;
