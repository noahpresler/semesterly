var Root = require('./root');
var TimetableActions = require('./actions/update_timetables');
var course_actions = require('./actions/course_actions');
_SEMESTER = "F";
var data = window.location.pathname.substring(1); // loading timetable data from url
var full_pattern = new RegExp("(jhu|uoft|umd|rutgers|uo)\/([fFsS]{1}?)\/(.*)");
if (data != null && data.match(full_pattern)) {
  matches = data.match(full_pattern);
  data = null
  if (typeof(Storage) !== "undefined")
    data = localStorage.getItem('data');
  $.get("/courses/"+ matches[1] + "/" + matches[2] +  "/code/" + matches[3], 
     {}, 
     function(response) {
        if (response.id !== undefined) {
          	ReactDOM.render(<Root school={matches[1]} 
                                  sem={matches[2]} 
                                  dataType={"load-course"} 
                                  code={matches[3]} 
                                  data={data} 
                                  initial_course_id={response.id}/>, 
                            document.getElementById('page'));
   		    TimetableActions.setSchool(matches[1]);
        }
     }.bind(this)
  );
} 
else if (!data && typeof(Storage) !== "undefined") { // didn't find in URL, try local storage
  data = localStorage.getItem('data');
	ReactDOM.render(
	  <Root data={data}/>,
	  document.getElementById('page')
	);
} 
else {
	ReactDOM.render(
 	 <Root data={data}/>,
	  document.getElementById('page')
	);
}
