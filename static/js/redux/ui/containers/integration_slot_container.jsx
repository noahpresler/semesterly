import {connect} from "react-redux";
import {IntegrationSlot} from "../integration_slot.jsx";

const mapStateToProps = (state) => {
    return {
        metrics: state.preferences.sort_metrics,
    }
}

const IntegrationSlotContainer = connect(
    mapStateToProps,
    {}
)(IntegrationSlot);

export default IntegrationSlotContainer;
