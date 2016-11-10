import { connect } from 'react-redux';
import { TutModal } from '../tut_modal.jsx';

const mapStateToProps = (state) => {
	return {
		signUpModalVisible: state.signupModal.isVisible,
		courseModalVisible: state.courseInfo.id != null,
		courseModalVisible: state.userInfo.overrideShow
	}
}

const mapDispatchToProps = (dispatch) => {
	return {}
}

const TutModalContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(TutModal);

export default TutModalContainer;
