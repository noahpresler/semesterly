import {connect} from "react-redux";
import {fetchFriends, saveSettings, changeUserInfo} from "../../actions/user_actions.jsx";
import {PeerModal} from "../peer_modal.jsx";
import * as ActionTypes from "../../constants/actionTypes.jsx";
import {openSignUpModal, togglePeerModal} from "../../actions/modal_actions.jsx";

const mapStateToProps = (state) => {
    let activeTimetable = state.timetables.items[state.timetables.active];
    return {
        liveTimetableCourses: activeTimetable.courses.filter(c => !c.fake), // don't want to consider courses that are shown on timetable only because of a 'HOVER_COURSE' action (i.e. fake courses)
        courseToColourIndex: state.ui.courseToColourIndex,
        peers: state.friends.peers,
        userInfo: state.userInfo.data,
        isVisible: state.peerModal.isVisible,
        isLoading: state.peerModal.isLoading
    }
}


const PeerModalContainer = connect(
    mapStateToProps,
    {
        fetchFriends,
        saveSettings,
        changeUserInfo,
        togglePeerModal,
        openSignUpModal,
    }
)(PeerModal);

export default PeerModalContainer;
