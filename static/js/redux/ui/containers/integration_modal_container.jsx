import { connect } from 'react-redux';
import { IntegrationModal } from '../integration_modal.jsx';

const mapStateToProps = (state) => {
	return {
		isVisible: state.integrationModal.isVisible,
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		toggleIntegrationModal: () => {dispatch({type: "TOGGLE_INTEGRATION_MODAL"})}
	}
}

const IntegrationModalContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(IntegrationModal);

export default IntegrationModalContainer;
