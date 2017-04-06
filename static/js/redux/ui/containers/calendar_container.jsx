import {connect} from "react-redux";
import Calendar from "../calendar.jsx";
import {saveTimetable} from "../../actions/user_actions.jsx";
import {handleCreateNewTimetable} from "../../actions/timetable_actions.jsx";
import {addTTtoGCal, createiCalfromTimetable, fetchShareTimetableLink} from "../../actions/calendar_actions.jsx";
import {togglePreferenceModal, triggerSaveCalendarModal} from "../../actions/modal_actions.jsx";

const getMaxHourBasedOnWindowHeight = () => {
    let calRow = $(".cal-row");
    let lastRowY = calRow.last().position();
    if (!lastRowY) {
        return 0;
    }
    let lastHour = 7 + calRow.length / 2;
    let hourHeight = calRow.height() * 2;
    let maxHour = parseInt(lastHour + ($(document).height() - 250 - lastRowY.top) / hourHeight);
    if (maxHour < lastHour) {
        return lastHour;
    }
    return Math.min(24, parseInt(maxHour));
}
/*
 gets the end hour of the current timetable, based on the class that ends latest
 */
const getMaxEndHour = (timetable, hasCourses) => {
    let maxEndHour = 17;
    if (!hasCourses) {
        return maxEndHour;
    }
    getMaxHourBasedOnWindowHeight();
    let courses = timetable.courses;
    for (let course_index in courses) {
        let course = courses[course_index];
        for (let slot_index in course.slots) {
            let slot = course.slots[slot_index];
            let end_hour = parseInt(slot.time_end.split(":")[0]);
            maxEndHour = Math.max(maxEndHour, end_hour);
        }
    }
    return Math.max(maxEndHour, getMaxHourBasedOnWindowHeight());

}
const mapStateToProps = (state) => {
    let timetables = state.timetables.items;
    let active = state.timetables.active;
    let hasTimetables = timetables[active].courses.length > 0;
    let {isFetchingShareLink, shareLink, shareLinkValid} = state.calendar;
    return {
        endHour: getMaxEndHour(timetables[active], hasTimetables),
        saving: state.savingTimetable.saving,
        dataLastUpdated: state.school.dataLastUpdated,
        isLoggedIn: state.userInfo.data.isLoggedIn,
        hasTimetables,
        isFetchingShareLink,
        shareLink,
        shareLinkValid,
        active,
    }
}

const CalendarContainer = connect(
    mapStateToProps,
    {
        saveTimetable,
        fetchShareTimetableLink,
        togglePreferenceModal,
        triggerSaveCalendarModal,
        addTTtoGCal,
        createiCalfromTimetable,
        handleCreateNewTimetable,
    }
)(Calendar);

export default CalendarContainer;
