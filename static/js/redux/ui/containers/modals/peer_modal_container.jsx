import { connect } from 'react-redux';
import { getActiveTT } from '../../../reducers/root_reducer';
import { changeUserInfo, fetchFriends, saveSettings } from '../../../actions/user_actions';
import PeerModal from '../../modals/peer_modal';
import { openSignUpModal, togglePeerModal } from '../../../actions/modal_actions';

const mapStateToProps = state => ({
    // don't want to consider courses that are shown on timetable only
    // because of a 'HOVER_COURSE' action (i.e. fake courses)
  courses: getActiveTT(state).courses,
  courseToColourIndex: state.ui.courseToColourIndex,
  peers: state.friends.peers,
  userInfo: state.userInfo.data,
  isVisible: state.peerModal.isVisible,
  isLoading: state.peerModal.isLoading,
});


const PeerModalContainer = connect(
    mapStateToProps,
  {
    fetchFriends,
    saveSettings,
    changeUserInfo,
    togglePeerModal,
    openSignUpModal,
  },
)(PeerModal);

export default PeerModalContainer;
