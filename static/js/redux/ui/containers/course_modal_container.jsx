import {connect} from "react-redux";
import {CourseModal} from "../course_modal.jsx";
import {
    addOrRemoveCourse,
    addOrRemoveOptionalCourse,
    hoverSection,
    unHoverSection,
} from "../../actions/timetable_actions.jsx";
import {fetchCourseInfo, react, setCourseId, openSignUpModal, changeUserInfo} from "../../actions/modal_actions.jsx";
import {saveSettings} from "../../actions/user_actions.jsx";
import {getSchoolSpecificInfo} from "../../constants/schools.jsx";

const mapStateToProps = (state) => {
    let lectureSections = [];
    let tutorialSections = [];
    let practicalSections = [];
    if (state.courseInfo.data.sections) {
        lectureSections = state.courseInfo.data.sections['L'];
        tutorialSections = state.courseInfo.data.sections['T'];
        practicalSections = state.courseInfo.data.sections['P'];
    }
    let courseSections = state.courseSections.objects;
    let activeTimetable = state.timetables.items[state.timetables.active];
    return {
        schoolSpecificInfo: getSchoolSpecificInfo(state.school.school),
        isFetching: state.courseInfo.isFetching,
        isFetchingClassmates: state.courseInfo.isFetching,
        data: state.courseInfo.data,
        classmates: state.courseInfo.classmates,
        id: state.courseInfo.id,
        lectureSections: lectureSections,
        tutorialSections: tutorialSections,
        practicalSections: practicalSections,
        hasHoveredResult: activeTimetable.courses.some(course => course.fake),
        prerequisites: state.courseInfo.data.prerequisites,
        description: state.courseInfo.data.description,
        popularityPercent: state.courseInfo.data.popularity_percent * 100,
        inRoster: courseSections[state.courseInfo.id] !== undefined,
        isLoggedIn: state.userInfo.data.isLoggedIn,
        hasSocial: state.userInfo.data.social_courses && state.userInfo.data.social_offerings,
        userInfo: state.userInfo.data,
        isSectionLocked: (courseId, section) => {
            if (courseSections[courseId] === undefined) {
                return false;
            }
            return Object.keys(courseSections[courseId]).some(
                (type) => courseSections[courseId][type] == section
            )
        },
        isSectionOnActiveTimetable: (courseId, section) => {
            return activeTimetable.courses.some(course => course.id === courseId && course.enrolled_sections.some(sec => sec == section));
        },
    }
}

const CourseModalContainer = connect(
    mapStateToProps,
    {
        hideModal: () => setCourseId(null),
        openSignUpModal,
        fetchCourseInfo,
        hoverSection,
        unHoverSection,
        addOrRemoveOptionalCourse,
        addOrRemoveCourse,
        react,
        saveSettings,
        changeUserInfo
    }
)(CourseModal);

export default CourseModalContainer;
