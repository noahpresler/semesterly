import { connect } from 'react-redux';
import { UserAcquisitionModal } from '../user_acquisition_modal.jsx';

const mapStateToProps = (state) => {
	return {
		isVisible: state.userAcquisitionModal.isVisible,
		userInfo: state.userInfo.data,
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		toggleUserAcquisitionModal: () => {dispatch({type: "TOGGLE_ACQUISITION_MODAL"})},
	}
}

const UserAcquisitionModalContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(UserAcquisitionModal);

export default UserAcquisitionModalContainer;
