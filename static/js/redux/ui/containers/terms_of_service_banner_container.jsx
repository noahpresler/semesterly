import { connect } from 'react-redux';
import TermsOfServiceBanner from '../terms_of_service_banner';
import { triggerTermsOfServiceBanner, dismissTermsOfServiceBanner } from '../../actions/modal_actions';

const mapStateToProps = state => ({
  isVisible: state.termsOfServiceBanner.isVisible,
  userInfo: state.userInfo.data,
});

const TermsOfServiceBannerContainer = connect(
    mapStateToProps,
  {
    triggerTermsOfServiceBanner,
    dismissTermsOfServiceBanner,
  },
)(TermsOfServiceBanner);

export default TermsOfServiceBannerContainer;
