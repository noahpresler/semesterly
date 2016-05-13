import { connect } from 'react-redux';
import { SignupModal } from '../signup_modal.jsx';

const mapStateToProps = (state) => {
	return {
		isVisible: state.signupModal.isVisible,
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		toggleSignupModal: () => {dispatch({type: "TOGGLE_SIGNUP_MODAL"})}
	}
}

const SignupModalContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(SignupModal);

export default SignupModalContainer;
