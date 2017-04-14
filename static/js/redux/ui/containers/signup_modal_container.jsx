import {connect} from "react-redux";
import {SignupModal} from "../signup_modal";
import {openSignUpModal} from "../../actions/modal_actions";


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
