import {connect} from "react-redux";
import {fetchCourseInfo} from "../../actions/modal_actions.jsx";
import {
    addCustomSlot,
    addOrRemoveCourse,
    addOrRemoveOptionalCourse,
    removeCustomSlot,
    updateCustomSlot
} from "../../actions/timetable_actions.jsx";
import {getSchoolSpecificInfo} from "../../constants/schools.jsx";
import SlotManager from "../slot_manager.jsx";


const mapStateToProps = (state, ownProps) => {
    let activeTimetable = state.timetables.items[state.timetables.active];
    return {
        timetable: activeTimetable || [],
        isLocked: (courseId, section) => {
            // check the courseSections state variable, which tells us
            // precisely which courses have which sections locked, if any
            let typeToLocked = state.courseSections.objects[courseId]
            for (let sectionType in typeToLocked) {
                if (section == typeToLocked[sectionType]) {
                    return true;
                }
            }
            // couldn't find a match, so the course isn't locked for this section
            return false;
        },
        isLoggedIn: state.userInfo.data.isLoggedIn,
        socialSections: state.userInfo.data.social_offerings,
        primaryDisplayAttribute: getSchoolSpecificInfo(state.school.school).primaryDisplay,
        courseToColourIndex: state.ui.courseToColourIndex,
        custom: state.customSlots,
        isCourseOptional: (cid) => state.optionalCourses.courses.findIndex(c => c.id === cid) > -1,
        getOptionalCourseById: (cid) => state.optionalCourses.courses.find(c => c.id === cid),
        classmates: (id, sec) => {
            let cm = state.classmates.courseToClassmates ? state.classmates.courseToClassmates.find(course => course.course_id === id) : [];
            return cm ? cm.classmates.filter(friend => friend.sections && friend.sections.find(s => s === sec) !== undefined) : [];
        },
        days: ownProps.days

    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        fetchCourseInfo: (courseId) => dispatch(fetchCourseInfo(courseId)),
        addOrRemoveOptionalCourse: (course) => dispatch(addOrRemoveOptionalCourse(course)),
        addOrRemoveCourse: addOrRemoveCourse,
        removeCustomSlot: removeCustomSlot,
        updateCustomSlot: updateCustomSlot,
        addCustomSlot: addCustomSlot
    }
}

const SlotManagerContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(SlotManager);

export default SlotManagerContainer;
