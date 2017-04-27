import {connect} from "react-redux";
import {TermsOfServiceBannerModal} from "../terms_of_service_banner_modal.jsx";
import * as ActionTypes from "../../constants/actionTypes.jsx";

const mapStateToProps = (state) => {
    return {
        isVisible: state.termsOfServiceBannerModal.isVisible,
        userInfo: state.userInfo.data,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        triggerTermsOfServiceBannerModal: () => {
            dispatch({type: ActionTypes.TRIGGER_TOS_BANNER_MODAL})
        }, 
    }
}

const TermsOfServiceBannerModalContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(TermsOfServiceBannerModal);

export default TermsOfServiceBannerModalContainer;
