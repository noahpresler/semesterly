import { connect } from 'react-redux';
import SignupModal from '../../modals/signup_modal';
import { openSignUpModal } from '../../../actions/modal_actions';


const mapStateToProps = state => ({
  isVisible: state.signupModal.isVisible,
});

const SignupModalContainer = connect(
    mapStateToProps,
  {
    toggleSignupModal: openSignUpModal,
  },
)(SignupModal);

export default SignupModalContainer;
