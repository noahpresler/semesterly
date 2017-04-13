import {connect} from "react-redux";
import {SignupModal} from "../signup_modal.jsx";
import {openSignUpModal} from "../../actions/modal_actions.jsx";


const mapStateToProps = (state) => {
    return {
        isVisible: state.signupModal.isVisible,
    }
}

const SignupModalContainer = connect(
    mapStateToProps,
    {
        toggleSignupModal: openSignUpModal
    }
)(SignupModal);

export default SignupModalContainer;
