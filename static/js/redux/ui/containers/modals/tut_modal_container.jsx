import { connect } from 'react-redux';
import TutModal from '../../modals/tut_modal';

const mapStateToProps = state => ({
  signUpModalVisible: state.signupModal.isVisible,
  courseModalVisible: state.userInfo.overrideShow,
  textbookModalVisible: state.textbookModal.isVisible,
  finalExamModalVisible: state.finalExamsModal.isVisible,
});

const TutModalContainer = connect(
    mapStateToProps,
)(TutModal);

export default TutModalContainer;
