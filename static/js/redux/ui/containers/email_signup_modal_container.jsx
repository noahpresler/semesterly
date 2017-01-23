import { connect } from 'react-redux';
import { EmailSignupModal } from '../email_signup_modal.jsx';

const mapStateToProps = (state) => {
	return {
		isVisible: state.emailSignupModal.isVisible,
		userInfo: state.userInfo.data,
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		toggleEmailSignupModal: () => {dispatch({type: "TOGGLE_EMAIL_SIGNUP_MODAL"})},
		closeUserAcquisitionModal: () => {dispatch({type: "CLOSE_ACQUISITION_MODAL"})},
	}
}

const EmailSignupModalContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(EmailSignupModal);

export default EmailSignupModalContainer;
