export const VALID_SCHOOLS = [
  "uoft", 
  "jhu", 
  "umd", 
  "uo", 
  "queens", 
  "vandy",
  "gw",
  "umich",
  "chapman",
  "salisbury",
];

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