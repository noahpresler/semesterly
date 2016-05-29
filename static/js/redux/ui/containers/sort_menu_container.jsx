import { connect } from 'react-redux';
import { SortMenu } from '../sort_menu.jsx';

const mapStateToProps = (state) => {
  return {
    metrics: state.sortMetrics,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    addMetric: (metric) => dispatch({type: "ADD_METRIC", metric: metric}),
    removeMetric: (metric) => dispatch({type: "REMOVE_METRIC", metric: metric}),
    changeMetric: (add, del) => {
      dispatch({type: "ADD_METRIC", metric: add})
      dispatch({type: "REMOVE_METRIC", metric: del})
    }
  }
}

const SortMenuContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(SortMenu);

export default SortMenuContainer;
