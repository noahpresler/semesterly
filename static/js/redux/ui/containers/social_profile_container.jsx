import { connect } from 'react-redux';
import SocialProfile from '../social_profile';
import { overrideSettingsShow, triggerAcquisitionModal } from '../../actions/modal_actions';

const mapStateToProps = state => ({
  userInfo: state.userInfo.data,
});

const SocialProfileContainer = connect(
    mapStateToProps,
  {
    showUserSettings: () => overrideSettingsShow(true),
    triggerAcquisitionModal,
  },
)(SocialProfile);

export default SocialProfileContainer;
