import {connect} from "react-redux";
import {TermsOfServiceModal} from "../terms_of_service_modal.jsx";
import * as ActionTypes from "../../constants/actionTypes.jsx";

const mapStateToProps = (state) => {
    return {
        isVisible: state.termsOfServiceModal.isVisible,
        userInfo: state.userInfo.data,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        toggleTermsOfServiceModal: () => {
            dispatch({type: ActionTypes.TOGGLE_TOS_MODAL})
        }, 
        triggerTermsOfServiceModal: () => {
            dispatch({type: ActionTypes.TRIGGER_TOS_MODAL})
        }, 
    }
}

const TermsOfServiceModalContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(TermsOfServiceModal);

export default TermsOfServiceModalContainer;
