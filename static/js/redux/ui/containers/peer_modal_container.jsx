import {connect} from "react-redux";
import {fetchFriends, saveSettings} from "../../actions/user_actions.jsx";
import {PeerModal} from "../peer_modal.jsx";
import * as ActionTypes from "../../constants/actionTypes.jsx";

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

const mapDispatchToProps = (dispatch) => {
    return {
        fetchFriends: () => dispatch(fetchFriends()),
        saveSettings: (callback) => dispatch(saveSettings(callback)),
        changeUserInfo: (info) => dispatch({
            type: "CHANGE_USER_INFO",
            data: info,
        }),
        togglePeerModal: () => dispatch({type: ActionTypes.TOGGLE_PEER_MODAL}),
        openSignupModal: () => dispatch({type: ActionTypes.TOGGLE_SIGNUP_MODAL})
    }
}

const PeerModalContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(PeerModal);

export default PeerModalContainer;
