import { getSchool, getSemester } from './init.jsx';
export const SET_SCHOOL = "SET_SCHOOL";
export const SET_SEMESTER = "SET_SEMESTER";
export const REQUEST_TIMETABLES = "REQUEST_TIMETABLES";
export const RECEIVE_TIMETABLES = "RECEIVE_TIMETABLES";
export const HALF_HOUR_HEIGHT = 25;
export const MAX_TIMETABLE_NAME_LENGTH = 30; // Length of "This is my fucking timetable!!"
export const VALID_SCHOOLS = [
  "uoft", 
  "jhu", 
  "umd", 
  "uo", 
  // "rutgers", 
  "queens", 
  "vandy",
  "gw",
  "umich",
  "chapman",
  "salisbury",
];

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

export const getSchoolSpecificInfo = (school) => {
	switch(school) {
		case "uoft":
			return {
        primaryDisplay: "code",
        areasName: "Breadths",
        departmentsName: "Departments",
        levelsName: "Levels",
        timesName: "Times",
        courseRegex: "([A-Z]{3}[A-Z0-9]\\d{2}[HY]\\d)",
        campuses: {
          1: "UTSG",
          3: "UTSC",
          5: "UTM"
        }
      }
		case "jhu":
			return {
        primaryDisplay: "name",
        areasName: "Areas",
        departmentsName: "Departments",
        levelsName: "Levels",
        timesName: "Times",
        courseRegex: "([A-Z]{2}\\.\\d{3}\\.\\d{3})",
        campuses: {
          1: ""
        }
      }
      case "queens":
      return {
        primaryDisplay: "name",
        areasName: "Areas",
        departmentsName: "Departments",
        levelsName: "Levels",
        timesName: "Times",
        campuses: {
          1: ""
        }
      }
    case "umd":
      return {
        primaryDisplay: "name",
        areasName: "Areas",
        departmentsName: "Departments",
        levelsName: "Levels",
        timesName: "Times",
        campuses: {
          1: ""
        }
      }
    case "chapman":
      return {
        primaryDisplay: "name",
        areasName: "Areas",
        departmentsName: "Departments",
        levelsName: "Levels",
        timesName: "Times",
        courseRegex: "([A-Z]{2,4}\\s\\d{3})",
        campuses: {
          1: ""
        }
      }
    case "vandy":
      return {
        primaryDisplay: "name",
        areasName: "Areas",
        departmentsName: "Departments",
        levelsName: "Levels",
        timesName: "Times",
        // course codes have dashes, in desciprtions dashes are spaces
        // courseRegex: "([A-Z-&]{2,7}\\s\\d{4}[W]?)",
        campuses: {
          1: ""
        }
      }
    case "gw":
      return {
        primaryDisplay: "name",
        areasName: "Areas",
        departmentsName: "Departments",
        levelsName: "Levels",
        timesName: "Times",
        // course codes in descriptions have lowercase department names, but I don't want to change the regex to include lowercase
        courseRegex: "([A-Z]{2,5}\\s\\d{4}[W]?)",
        campuses: {
          1: ""
        }
      }
    case "umich":
      return {
        primaryDisplay: "name",
        areasName: "Areas",
        departmentsName: "Departments",
        levelsName: "Levels",
        timesName: "Times",
        // some classes are just numbers, not included in this regex, cuz some descrpitions have years
        courseRegex: "([A-Z]{2,8}\\s\\d{3})",
        campuses: {
          1: ""
        }
      }
    case "salisbury":
      return {
        primaryDisplay: "name",
        areasName: "Areas",
        departmentsName: "Departments",
        levelsName: "Levels",
        timesName: "Times",
        // some classes are just numbers, not included in this regex, cuz some descrpitions have years
        courseRegex: "([A-Z]{3,4} \\d{2,3})",
        semesters: {
          F: "Fall 2016",
          S: "Spring 2017"
        },
        campuses: {
          1: ""
        }
      }
    default:
	  return {
        primaryDisplay: "code",
        areasName: "Areas",
        departmentsName: "Departments",
        levelsName: "Levels",
        timesName: "Times",
        campuses: {
          1: ""
        }
      }
	}
}

export const COLOUR_DATA = [
    // red
    { background: "#FD7473", highlight: "#e36867", border: "#b15150", font: "#222" },
    // blue
    { background: "#5CCCF2", highlight: "#52b7d9", border: "#408ea9", font: "#222" },
    // turquoise 
    { background: "#36DEBB", highlight: "#30c7a8", border: "#259b82", font: "#222" },
    // 'yellow'
    { background: "#FFD462", highlight: "#e5be58", border: "#b29444", font: "#222" },
    // purple
    { background: "#C585DE", highlight: "#b177c7", border: "#895d9b", font: "#222" },
    // green
    { background: "#53e997", highlight: "#4ad187", border: "#3aa369", font: "#222" },
    { background: "#D4DBC8", highlight: "#B5BFA3", border: "#97A086", font: "#222" },
    { background: "#E7F76D", highlight: "#C9E20A", border: "#AFC11F", font: "#222" },
    { background: "#A3F5F2", highlight: "#7CD2CF", border: "#53ABA8", font: "#222" },
    { background: "#7499A2", highlight: "#668B94", border: "#6C7A89", font: "#222" },
    { background: "#E7F76D", highlight: "#C4D44D", border: "#6C7A89", font: "#222" },
    { background: "#C8F7C5", highlight: "#C4D44D", border: "#548A50", font: "#222" },

    { background: "#4c7fd8", highlight: "#6598f1", border: "#375994", font: "#222" },
    
    // x2

    { background: "#FD7473", highlight: "#e36867", border: "#b15150", font: "#222" },
    { background: "#5CCCF2", highlight: "#52b7d9", border: "#408ea9", font: "#222" },
    { background: "#36DEBB", highlight: "#30c7a8", border: "#259b82", font: "#222" },
    { background: "#FFD462", highlight: "#e5be58", border: "#b29444", font: "#222" },
    { background: "#C585DE", highlight: "#b177c7", border: "#895d9b", font: "#222" },
    { background: "#53e997", highlight: "#4ad187", border: "#3aa369", font: "#222" },
    { background: "#D4DBC8", highlight: "#B5BFA3", border: "#97A086", font: "#222" },
    { background: "#E7F76D", highlight: "#C9E20A", border: "#AFC11F", font: "#222" },
    { background: "#A3F5F2", highlight: "#7CD2CF", border: "#53ABA8", font: "#222" },
    { background: "#7499A2", highlight: "#668B94", border: "#6C7A89", font: "#222" },
    { background: "#E7F76D", highlight: "#C4D44D", border: "#6C7A89", font: "#222" },
    { background: "#C8F7C5", highlight: "#C4D44D", border: "#548A50", font: "#222" },
    { background: "#4c7fd8", highlight: "#6598f1", border: "#375994", font: "#222" },

] // consider #CF000F, #e8fac3, #C8F7C5

export const REACTION_MAP = {
  FIRE: {
  	unicode: '\uD83D\uDD25',
  	name: 'Must Take'
  },
  LOVE: {
  	unicode: '\uD83D\uDE0D',
  	name: 'Love It'
  },
  CRAP: {
  	unicode: '\uD83D\uDCA9',
  	name: 'Crap Class'
  },
  OKAY: {
  	unicode: '\uD83D\uDE10',
  	name: "It's Aight"
  },
  BORING: {
  	unicode: '\uD83D\uDE34',
  	name: 'Boring'
  },
  HARD: {
  	unicode: '\uD83D\uDE29',
  	name: 'Hard'
  },
  EASY: {
  	unicode: '\uD83D\uDCAF',
  	name: 'Easy'
  },
  INTERESTING: {
  	unicode: '\uD83E\uDD13',
  	name: 'Interesting'
  }
}

export const DAYS = ['M', 'T', 'W', 'R', 'F']

export const DRAGTYPES = {
  DRAG: 'drag', // drag a custom slot to a new location
  EXTEND: 'extend', // extend the length of a custom slot
  CREATE: 'create' // create a new custom slot
}

// dictionary representing the order in which semesters occur
export const SEMESTER_RANKS = {
  'Winter' : 0,
  'Spring' : 1,
  'Fall'   : 2
}
