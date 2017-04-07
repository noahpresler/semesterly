import {connect} from "react-redux";
import {SaveCalendarModal} from "../save_calendar_modal.jsx";
import {addTTtoGCal, createICalFromTimetable} from "../../actions/calendar_actions.jsx";
import {toggleSaveCalendarModal} from "../../actions/modal_actions.jsx";

const mapStateToProps = (state) => {
    return {
        isVisible: state.saveCalendarModal.isVisible,
        isDownloading: state.saveCalendarModal.isDownloading,
        isUploading: state.saveCalendarModal.isUploading,
        hasDownloaded: state.saveCalendarModal.hasDownloaded,
        hasUploaded: state.saveCalendarModal.hasUploaded,
        userInfo: state.userInfo.data,
    }
}

const SaveCalendarModalContainer = connect(
    mapStateToProps,
    {
        toggleSaveCalendarModal,
        addTTtoGCal,
        createICalFromTimetable,
    }
)(SaveCalendarModal);

export default SaveCalendarModalContainer;
