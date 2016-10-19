import { connect } from 'react-redux';
import { IntegrationSlot } from '../integration_slot.jsx';

const mapStateToProps = (state) => {
  return {
    metrics: state.preferences.sort_metrics,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    addMetric: (metric) => dispatch({type: "ADD_METRIC", metric: metric}),
    removeMetric: (metric) => dispatch({type: "REMOVE_METRIC", metric: metric}),
    changeMetric: (add, del) => dispatch({type: "SWITCH_METRIC", add: add, del: del}),
    toggleMetricOrder: (metric) => dispatch({type: "TOGGLE_METRIC_ORDER", metric: metric})
  }
}

const IntegrationSlotContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(IntegrationSlot);

export default IntegrationSlotContainer;
