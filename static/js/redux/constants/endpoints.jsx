/* server endpoints */
export const getAddTTtoGCalEndpoint = () => '/user/gcal/';
export const getLogiCalEndpoint = () => '/user/log_ical/';
export const getLogFinalExamViewEndpoint = () => '/user/log_final_exam/';
export const getLogFacebookAlertViewEndpoint = () => '/user/log_fb_alert_view/';
export const getLogFacebookAlertClickEndpoint = () => '/user/log_fb_alert_click/';
export const getCourseInfoEndpoint = (courseId, semester) => `/courses/${semester}/id/${courseId}/`;
export const getCourseSearchEndpoint = (query, semester) => `/search/${semester}/${query}/`;
export const getTimetablesEndpoint = () => '/timetables/';
export const getLoadSavedTimetablesEndpoint = semester => `/user/timetables/${semester.name}/${semester.year}/`;
export const getSaveTimetableEndpoint = () => '/user/timetables/';
export const getDeleteTimetableEndpoint = (semester, name) => `/user/timetables/${semester.name}/${semester.year}/${name}/`;
export const getSaveSettingsEndpoint = () => '/user/settings/';
export const getClassmatesEndpoint = (semester, courses) => `/user/classmates/${semester.name}/${semester.year}?${$.param({ course_ids: courses })}`;
export const getClassmatesInCourseEndpoint = (school, semester, courseId) => `/course_classmates/${school}/${semester}/id/${courseId}/`;
export const getMostClassmatesCountEndpoint = (semester, courses) => `/user/classmates/${semester.name}/${semester.year}?${$.param({ course_ids: courses, count: true })}`;
export const getFriendsEndpoint = semester => `/user/classmates/${semester.name}/${semester.year}/`;
export const getSchoolInfoEndpoint = school => `/school/${school}/`;
export const getReactToCourseEndpoint = () => '/user/reactions/';
export const getRequestShareTimetableLinkEndpoint = () => '/timetables/links/';
export const getSetRegistrationTokenEndpoint = () => '/registration-token/';
export const deleteRegistrationTokenEndpoint = endpoint => `/registration-token/${endpoint}/`;
export const getIntegrationEndpoint = (integrationId, courseId) => `/integrations/${integrationId}/course/${courseId}/`;
export const getFinalExamSchedulerEndpoint = () => '/exams/';
export const getRequestShareExamLinkEndpoint = () => '/exams/links/';
export const acceptTOSEndpoint = () => '/tos/accept/';
export function getCourseShareLinkFromModal(code, semester) {
  return `/course/${encodeURIComponent(code)}/${semester.name}/${semester.year}`;
}

export function getCourseShareLink(code, semester) {
  return `${window.location.href.split('/')[2]}/course/${encodeURIComponent(code)}/${semester.name}/${semester.year}`;
}
export function getExamShareLink(hash) {
  return `${window.location.href.split('/')[2]}/exams/links/${encodeURIComponent(hash)}/`;
}
