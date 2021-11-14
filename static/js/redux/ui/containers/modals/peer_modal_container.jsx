/*
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
*/

import { connect } from 'react-redux';
import { getActiveTimetableDenormCourses } from '../../../reducers';
import { fetchFriends, saveSettings } from '../../../actions/user_actions';
import { changeUserInfo } from '../../../actions';
import PeerModal from '../../modals/peer_modal';
import { openSignUpModal, togglePeerModal } from '../../../actions/modal_actions';

const mapStateToProps = state => ({
    // don't want to consider courses that are shown on timetable only
    // because of a 'HOVER_COURSE' action (i.e. fake courses)
  courses: getActiveTimetableDenormCourses(state),
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
