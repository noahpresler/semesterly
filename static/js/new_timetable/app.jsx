var Root = require('./root');
var TimetableActions = require('./actions/update_timetables');
courses = [];
_SCHOOL = "jhu";
_SEMESTER = "S";

ReactDOM.render(
  <Root />,
  document.getElementById('page')
);

var data = window.location.pathname.substring(1); // loading timetable data from url
if (data) {
	TimetableActions.loadPresetTimetable(data);
}
