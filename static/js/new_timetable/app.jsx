var Root = require('./root');
var TimetableActions = require('./actions/update_timetables');
_SEMESTER = "S";

ReactDOM.render(
  <Root />,
  document.getElementById('page')
);

var data = window.location.pathname.substring(1); // loading timetable data from url
if (!data && typeof(Storage) !== "undefined") { // didn't find in URL, try local storage
    data = localStorage.getItem('data');
} 
if (data) {
	TimetableActions.loadPresetTimetable(data);
}
