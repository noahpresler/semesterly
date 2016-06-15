import { getSchool, getSemester } from './init.jsx';
export const VALID_SCHOOLS = ["uoft", "jhu", "umd", "uo", "rutgers", "queens"];
export const VALID_SEMESTERS = ["F", "S"];
export const SET_SCHOOL = "SET_SCHOOL";
export const SET_SEMESTER = "SET_SEMESTER";
export const REQUEST_TIMETABLES = "REQUEST_TIMETABLES";
export const RECEIVE_TIMETABLES = "RECEIVE_TIMETABLES";
export const HALF_HOUR_HEIGHT = 25;
export const MAX_TIMETABLE_NAME_LENGTH = 30; // Length of "This is my fucking timetable!!"

/* server endpoints */
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
export const getSaveSettingsEndpoint = () => {
	return "/user/save_settings/"
}
export const getClassmatesEndpoint = () => {
	return "/user/get_classmates/"
}
export const getSchoolInfoEndpoint = () => {
	return "/school_info/" + getSchool() + "/";
}
export const getReactToCourseEndpoint = () => {
  return "/react/";
}
export const getLoadSavedTimetablesEndpoint = (semester) => {
  return "/user/get_saved_timetables/" + getSchool() + "/" + semester + "/";
}
export const getRequestShareTimetableLinkEndpoint = () => {
  return "/share/link/";
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
        semesters: {
          F: "Fall 2016",
          S: "Winter 2017"
        },
        campuses: {
          1: "UTSG",
          2: "UTSC",
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
        semesters: {
          F: "Fall 2016",
          S: "Spring 2017"
        },
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
        semesters: {
          F: "Fall 2016",
          S: "Spring 2017"
        },
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
    { background: "#C8F7C5", highlight: "#C4D44D", border: "#548A50", font: "#222" }
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
  TEARS: {
  	unicode: '\uD83D\uDE2D',
  	name: 'Tears'
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
