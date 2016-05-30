import { connect } from 'react-redux';
import { SortMenu } from '../sort_menu.jsx';

const mapStateToProps = (state) => {
  return {
    sortMetrics: state.preferences.sort_metrics,
    availMetrics: state.preferences.avail_metrics
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    addMetric: (metric) => dispatch({type: "ADD_METRIC", metric: metric}),
    removeMetric: (metric) => dispatch({type: "REMOVE_METRIC", metric: metric}),
    changeMetric: (add, del) => {
      // console.log('add: ', add, 'del: ', del)
      // dispatch({type: "ADD_METRIC", metric: add})
      // dispatch({type: "REMOVE_METRIC", metric: del})
      dispatch({type: 'SWITCH_METRIC', add: add, del: del})
    },
    toggleMetricOrder: (metric) => dispatch({type: "TOGGLE_METRIC_ORDER", metric: metric})
  }
}

const SortMenuContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(SortMenu);

export default SortMenuContainer;
