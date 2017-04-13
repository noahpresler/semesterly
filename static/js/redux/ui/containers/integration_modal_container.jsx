import {connect} from "react-redux";
import {IntegrationModal} from "../integration_modal.jsx";
import {toggleIntegrationModal} from "../../actions/modal_actions.jsx";

const mapStateToProps = (state) => {
    return {
        isVisible: state.integrationModal.isVisible,
        course_id: state.integrationModal.id,
        enabled: state.integrationModal.enabled
    }
}

const IntegrationModalContainer = connect(
    mapStateToProps,
    {
        toggleIntegrationModal
    }
)(IntegrationModal);

export default IntegrationModalContainer;
