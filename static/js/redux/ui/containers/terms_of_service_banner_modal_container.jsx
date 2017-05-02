import { connect } from 'react-redux';
import { TermsOfServiceBannerModal } from '../terms_of_service_banner_modal';
import { triggerTermsOfServiceBannerModal } from '../../actions/modal_actions';

const mapStateToProps = state => ({
  isVisible: state.termsOfServiceBannerModal.isVisible,
  userInfo: state.userInfo.data,
});

const TermsOfServiceBannerModalContainer = connect(
    mapStateToProps,
  {
    triggerTermsOfServiceBannerModal,
  },
)(TermsOfServiceBannerModal);

export default TermsOfServiceBannerModalContainer;
