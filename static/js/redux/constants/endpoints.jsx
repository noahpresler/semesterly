import { getSchool, getSemester } from '../init';

/* server endpoints */
export const getAddTTtoGCalEndpoint = () => '/user/add_to_gcal/';
export const getLogiCalEndpoint = () => '/user/log_ical/';
export const getLogFinalExamViewEndpoint = () => '/user/log_final_exam/';
export const getLogFacebookAlertViewEndpoint = () => '/user/log_fb_alert_view/';
export const getLogFacebookAlertClickEndpoint = () => '/user/log_fb_alert_click/';
export const getCourseInfoEndpoint = courseId => `/courses/${getSemester()}/id/${courseId}/`;
export const getCourseSearchEndpoint = query => `/search/${getSemester()}/${query}/`;
export const getTimetablesEndpoint = () => '/timetables/';
export const getSaveTimetableEndpoint = () => '/user/timetables/';
export const getCloneTimetableEndpoint = () => '/user/duplicate_timetable/';
export const getDeleteTimetableEndpoint = () => '/user/delete_timetable/';
export const getSaveSettingsEndpoint = () => '/user/settings/';
export const getClassmatesEndpoint = () => '/user/get_classmates/';
export const getClassmatesInCourseEndpoint = courseId => `/course_classmates/${getSchool()}/${getSemester()}/id/${courseId}/`;
export const getMostClassmatesCountEndpoint = () => '/user/get_most_classmates_count/';
export const getFriendsEndpoint = () => '/user/find_friends/';
export const getSchoolInfoEndpoint = () => `/school/${getSchool()}/`;
export const getReactToCourseEndpoint = () => '/react/';
export const getLoadSavedTimetablesEndpoint = semester => `/user/get_saved_timetables/${getSchool()}/${semester.name}/${semester.year}/`;
export const getRequestShareTimetableLinkEndpoint = () => '/timetables/links/';
export const getSetRegistrationTokenEndpoint = () => '/setRegistrationToken/';
export const deleteRegistrationTokenEndpoint = () => '/deleteRegistrationToken/';
export const getIntegrationGetEndpoint = (integrationId, courseId) => `/integration/get/${integrationId}/course/${courseId}/`;
export const getIntegrationDelEndpoint = (integrationId, courseId) => `/integration/del/${integrationId}/course/${courseId}/`;
export const getIntegrationAddEndpoint = (integrationId, courseId) => `/integration/add/${integrationId}/course/${courseId}/`;
export const getFinalExamSchedulerEndpoint = () => '/get_final_exams/';
