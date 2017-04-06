import {connect} from "react-redux";
import {IntegrationModal} from "../integration_modal.jsx";

const mapStateToProps = (state) => {
    return {
        isVisible: state.integrationModal.isVisible,
        course_id: state.integrationModal.id,
        enabled: state.integrationModal.enabled
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        toggleIntegrationModal: () => {
            dispatch({type: ActionTypes.TOGGLE_INTEGRATION_MODAL})
        }
    }
}

const IntegrationModalContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(IntegrationModal);

export default IntegrationModalContainer;
