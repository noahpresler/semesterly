var Root = require('./root');
var TimetableActions = require('./actions/update_timetables');
var course_actions = require('./actions/course_actions');
_SEMESTER = "S";

var data = window.location.pathname.substring(1); // loading timetable data from url
if (!data && typeof(Storage) !== "undefined") { // didn't find in URL, try local storage
    data = localStorage.getItem('data');
} 

ReactDOM.render(
  <Root data={data}/>,
  document.getElementById('page')
);

