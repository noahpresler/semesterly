import { connect } from 'react-redux';
import TermsOfServiceModal from '../terms_of_service_modal';
import { triggerTermsOfServiceModal } from '../../constants/actionTypes';

const mapStateToProps = state => ({
  isVisible: state.termsOfServiceModal.isVisible,
  userInfo: state.userInfo.data,
});

const TermsOfServiceModalContainer = connect(
    mapStateToProps,
  {
    triggerTermsOfServiceModal,
  },
)(TermsOfServiceModal);

export default TermsOfServiceModalContainer;
