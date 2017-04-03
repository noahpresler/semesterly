import { connect } from 'react-redux';
import { SignupModal } from '../signup_modal.jsx';
import * as ActionTypes from '../../constants/actionTypes.jsx';



const mapStateToProps = (state) => {
	return {
		isVisible: state.signupModal.isVisible,
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		toggleSignupModal: () => {dispatch({type: ActionTypes.TOGGLE_SIGNUP_MODAL})}
	}
}

const SignupModalContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(SignupModal);

export default SignupModalContainer;
