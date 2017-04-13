import {connect} from "react-redux";
import TimetableNameInput from "../timetable_name_input.jsx";
import {openSignUpModal} from "../../actions/modal_actions.jsx";
import {changeTimetableName} from "../../actions/user_actions.jsx";


const mapStateToProps = (state) => {
    let savingTimetable = state.savingTimetable;
    return {
        activeLoadedTimetableName: savingTimetable.activeTimetable.name, // the name of the user's "being-edited" saved timetable
        saving: savingTimetable.saving,
        upToDate: savingTimetable.upToDate,
        isLoggedIn: state.userInfo.data.isLoggedIn
    }
}
const TimetableNameInputContainer = connect(
    mapStateToProps,
    {
        openSignUpModal,
        changeTimetableName
    }
)(TimetableNameInput);

export default TimetableNameInputContainer;
