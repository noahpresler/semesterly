import { connect } from 'react-redux';
import IntegrationModal from '../../modals/integration_modal';
import { toggleIntegrationModal } from '../../../actions/modal_actions';

const mapStateToProps = state => ({
  isVisible: state.integrationModal.isVisible,
  course_id: state.integrationModal.id,
  enabled: state.integrationModal.enabled,
});

const IntegrationModalContainer = connect(
    mapStateToProps,
  {
    toggleIntegrationModal,
  },
)(IntegrationModal);

export default IntegrationModalContainer;
