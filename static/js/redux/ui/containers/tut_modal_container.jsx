import {connect} from "react-redux";
import {TutModal} from "../tut_modal";

const mapStateToProps = (state) => {
    return {
        signUpModalVisible: state.signupModal.isVisible,
        courseModalVisible: state.courseInfo.id != null,
        courseModalVisible: state.userInfo.overrideShow,
        textbookModalVisible: state.textbookModal.isVisible,
        finalExamModalVisible: state.finalExamsModal.isVisible
    }
}

const TutModalContainer = connect(
    mapStateToProps
)(TutModal);

export default TutModalContainer;
