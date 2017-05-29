import { connect } from 'react-redux';
import TermsOfServiceBanner from '../terms_of_service_banner';
import { triggerTermsOfServiceBanner, dismissTermsOfServiceBanner } from '../../actions/modal_actions';
import { acceptTOS } from '../../actions/user_actions';

const mapStateToProps = state => ({
  isVisible: state.termsOfServiceBanner.isVisible,
  userInfo: state.userInfo.data,
  acceptTOS,
});

const TermsOfServiceBannerContainer = connect(
    mapStateToProps,
  {
    triggerTermsOfServiceBanner,
    dismissTermsOfServiceBanner,
  },
)(TermsOfServiceBanner);

export default TermsOfServiceBannerContainer;
