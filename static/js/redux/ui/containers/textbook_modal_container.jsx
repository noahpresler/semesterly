import {connect} from "react-redux";
import {TextbookModal} from "../textbook_modal.jsx";
import {toggleTextbookModal} from "../../actions/modal_actions.jsx";

const mapStateToProps = (state) => {
    let activeTimetable = state.timetables.items[state.timetables.active];
    return {
        isVisible: state.textbookModal.isVisible,
        liveTimetableCourses: activeTimetable.courses.filter(c => !c.fake),
        isLoading: state.timetables.isFetching
    }
}


const TextbookModalContainer = connect(
    mapStateToProps,
    {
        toggleTextbookModal
    }
)(TextbookModal);

export default TextbookModalContainer;
