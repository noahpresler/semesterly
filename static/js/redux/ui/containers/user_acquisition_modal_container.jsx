import {connect} from "react-redux";
import {UserAcquisitionModal} from "../user_acquisition_modal.jsx";
import {triggerAcquisitionModal} from "../../actions/modal_actions.jsx";

const mapStateToProps = (state) => {
    return {
        isVisible: state.userAcquisitionModal.isVisible,
        userInfo: state.userInfo.data,
    }
}

const UserAcquisitionModalContainer = connect(
    mapStateToProps,
    {
        toggleUserAcquisitionModal: triggerAcquisitionModal
    }
)(UserAcquisitionModal);

export default UserAcquisitionModalContainer;
