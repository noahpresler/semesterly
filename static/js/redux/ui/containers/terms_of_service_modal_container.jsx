import { connect } from 'react-redux';
import TermsOfServiceModal from '../terms_of_service_modal';
import { triggerTermsOfServiceModal } from '../../actions/modal_actions';

const mapStateToProps = state => ({
  isVisible: state.termsOfServiceModal.isVisible,
  userInfo: state.userInfo.data,
});

const TermsOfServiceModalContainer = connect(
    mapStateToProps,
  {
    acceptTOS: triggerTermsOfServiceModal,
  },
)(TermsOfServiceModal);

export default TermsOfServiceModalContainer;
