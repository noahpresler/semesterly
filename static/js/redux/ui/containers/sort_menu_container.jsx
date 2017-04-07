import {connect} from "react-redux";
import {SortMenu} from "../sort_menu.jsx";
import * as ActionTypes from "../../constants/actionTypes.jsx";

const mapStateToProps = (state) => {
    return {
        metrics: state.preferences.sort_metrics,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        addMetric: (metric) => dispatch({type: ActionTypes.ADD_METRIC, metric: metric}),
        removeMetric: (metric) => dispatch({type: ActionTypes.REMOVE_METRIC, metric: metric}),
        changeMetric: (add, del) => dispatch({type: ActionTypes.SWITCH_METRIC, add: add, del: del}),
        toggleMetricOrder: (metric) => dispatch({type: ActionTypes.TOGGLE_METRIC_ORDER, metric: metric})
    }
}

const SortMenuContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(SortMenu);

export default SortMenuContainer;
