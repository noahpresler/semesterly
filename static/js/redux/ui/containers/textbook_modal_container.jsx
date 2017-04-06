import {connect} from "react-redux";
import {TextbookModal} from "../textbook_modal.jsx";
import * as ActionTypes from "../../constants/actionTypes.jsx";

const mapStateToProps = (state) => {
    let activeTimetable = state.timetables.items[state.timetables.active];
    return {
        isVisible: state.textbookModal.isVisible,
        liveTimetableCourses: activeTimetable.courses.filter(c => !c.fake),
        isLoading: state.timetables.isFetching
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        toggleTextbookModal: () => {
            dispatch({type: ActionTypes.TOGGLE_TEXTBOOK_MODAL})
        },
    }
}

const TextbookModalContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(TextbookModal);

export default TextbookModalContainer;
