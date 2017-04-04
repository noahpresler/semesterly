import { getSchool, getSemester } from '../init.jsx';

/* server endpoints */
export const getAddTTtoGCalEndpoint = (timetable) => {
  return "/user/add_to_gcal/"
};
export const getLogiCalEndpoint = () => { 
  return "/user/log_ical/"
};
export const getLogFinalExamViewEndpoint = () => { 
  return "/user/log_final_exam/"
};
export const getLogFacebookAlertViewEndpoint = () => { 
  return "/user/log_fb_alert_view/"
};
export const getLogFacebookAlertClickEndpoint = () => { 
  return "/user/log_fb_alert_click/"
};
export const getCourseInfoEndpoint = (course_id) => {
	return "/courses/" + getSchool() + "/" + getSemester() + "/id/" + course_id + "/";
};
export const getCourseSearchEndpoint = (query) => {
	return "/search/" + getSchool() + "/" + getSemester() + "/" + query + "/";
};
export const getAdvancedSearchEndpoint = (query) => {
	return "/advanced_search/";
};
export const getTimetablesEndpoint = () => {
	return "/get_timetables/";
};
export const getUserInfoEndpoint = () => {
	return "/user/info/";
};
export const getSaveTimetableEndpoint = () => {
	return "/user/save_timetable/";
};
export const getCloneTimetableEndpoint = () => {
  return "/user/duplicate_timetable/";
}   
export const getDeleteTimetableEndpoint = () => {
  return "/user/delete_timetable/";
}
export const getSaveSettingsEndpoint = () => {
	return "/user/save_settings/"
}
export const getClassmatesEndpoint = () => {
  return "/user/get_classmates/"
}
export const getClassmatesInCourseEndpoint = (course_id) => {
  return "/course_classmates/" + getSchool() + "/" + getSemester() + "/id/" + course_id + "/";
}
export const getMostClassmatesCountEndpoint = () => {
  return "/user/get_most_classmates_count/"
}
export const getFriendsEndpoint = () => {
  return "/user/find_friends/"
}
export const getSchoolInfoEndpoint = () => {
	return "/school_info/" + getSchool() + "/";
}
export const getReactToCourseEndpoint = () => {
  return "/react/";
}
export const getLoadSavedTimetablesEndpoint = (semester) => {
  return "/user/get_saved_timetables/" + getSchool() + "/" + semester.name + "/" + semester.year + "/";
}
export const getRequestShareTimetableLinkEndpoint = () => {
  return "/share/link/";
}
export const getSetRegistrationTokenEndpoint = () => {
  return "/setRegistrationToken/";
}
export const deleteRegistrationTokenEndpoint = () => {
  return "/deleteRegistrationToken/";
}
export const getIntegrationGetEndpoint = (integration_id, course_id) => {
  return "/integration/get/" + integration_id + "/course/" + course_id + "/";
}
export const getIntegrationDelEndpoint = (integration_id, course_id) => {
  return "/integration/del/" + integration_id + "/course/" + course_id + "/";
}
export const getIntegrationAddEndpoint = (integration_id, course_id) => {
  return "/integration/add/" + integration_id + "/course/" + course_id + "/";
}
export const getFinalExamSchedulerEndpoint = () => {
  return "/get_final_exams/";
}