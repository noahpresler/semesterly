import {connect} from "react-redux";
import {SortMenu} from "../sort_menu.jsx";
import {addMetric, changeMetric, removeMetric, toggleMetricOrder} from "../../actions/timetable_actions.jsx";

const mapStateToProps = (state) => {
    return {
        metrics: state.preferences.sort_metrics,
    }
}

const SortMenuContainer = connect(
    mapStateToProps,
    {
        addMetric,
        removeMetric,
        changeMetric,
        toggleMetricOrder
    }
)(SortMenu);

export default SortMenuContainer;
