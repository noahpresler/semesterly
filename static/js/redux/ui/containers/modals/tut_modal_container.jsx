import { connect } from 'react-redux';
import TutModal from '../../modals/tut_modal';

const mapStateToProps = state => ({
  signUpModalVisible: state.signupModal.isVisible,
  settingModalVisible: state.userInfo.overrideShow,
  courseModalVisible: state.courseInfo.id != null,
  textbookModalVisible: state.textbookModal.isVisible,
  finalExamModalVisible: state.finalExamsModal.isVisible,
});

const TutModalContainer = connect(
    mapStateToProps,
)(TutModal);

export default TutModalContainer;
