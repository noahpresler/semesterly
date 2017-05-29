import { connect } from 'react-redux';
import TermsOfServiceModal from '../terms_of_service_modal';
import { triggerTermsOfServiceModal } from '../../actions/modal_actions';
import { acceptTOS } from '../../actions/user_actions';

const mapStateToProps = state => ({
  isVisible: state.termsOfServiceModal.isVisible,
  userInfo: state.userInfo.data,
  acceptTOS,
});

const TermsOfServiceModalContainer = connect(
    mapStateToProps,
  {
    triggerTermsOfServiceModal,
  },
)(TermsOfServiceModal);

export default TermsOfServiceModalContainer;
