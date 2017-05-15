import { connect } from 'react-redux';
import UserAcquisitionModal from '../../modals/user_acquisition_modal';
import { triggerAcquisitionModal } from '../../../actions/modal_actions';

const mapStateToProps = state => ({
  isVisible: state.userAcquisitionModal.isVisible,
  userInfo: state.userInfo.data,
});

const UserAcquisitionModalContainer = connect(
    mapStateToProps,
  {
    toggleUserAcquisitionModal: triggerAcquisitionModal,
  },
)(UserAcquisitionModal);

export default UserAcquisitionModalContainer;
