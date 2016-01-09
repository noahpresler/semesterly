var Root = require('./root');
var TimetableActions = require('./actions/update_timetables');
courses = [];
_SCHOOL = "jhu";
_SEMESTER = "S";

ReactDOM.render(
  <Root />,
  document.getElementById('page')
);

TimetableActions.loadPresetTimetable("3&4511&4592+(01)&4945");
