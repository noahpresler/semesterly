import {connect} from "react-redux";
import {IntegrationSlot} from "../integration_slot.jsx";

const mapStateToProps = (state) => {
    return {
        metrics: state.preferences.sort_metrics,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {}
}

const IntegrationSlotContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(IntegrationSlot);

export default IntegrationSlotContainer;
