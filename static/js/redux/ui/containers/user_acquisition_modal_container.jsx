import {connect} from "react-redux";
import {UserAcquisitionModal} from "../user_acquisition_modal.jsx";
import * as ActionTypes from "../../constants/actionTypes.jsx";

const mapStateToProps = (state) => {
    return {
        isVisible: state.userAcquisitionModal.isVisible,
        userInfo: state.userInfo.data,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        toggleUserAcquisitionModal: () => {
            dispatch({type: ActionTypes.TOGGLE_ACQUISITION_MODAL})
        },
    }
}

const UserAcquisitionModalContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(UserAcquisitionModal);

export default UserAcquisitionModalContainer;
