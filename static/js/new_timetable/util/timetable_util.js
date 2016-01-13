module.exports = {
	getLinkData: function(school, courses_to_sections, index, preferences) {
	    var data = school + "&";
	    for (var pref in preferences) {
	    	data += pref + "=" + preferences[pref] + ";";
	    }
	    data = data.slice(0, -1);
	    data += "&" + index + "&";
	    var c_to_s = courses_to_sections;
	    for (var course_id in c_to_s) {
	      data += course_id;

	      var mapping = c_to_s[course_id];
	      for (var section_heading in mapping) { // i.e 'L', 'T', 'P', 'S'
	        if (mapping[section_heading] != "") {
	          data += "+" + mapping[section_heading]; // delimiter for sections locked
	        }
	      }
	      data += "&"; // delimiter for courses
	    }
	    data = data.slice(0, -1);
	    if (data.length < 3) {data = "";}

	    return data;
	},
}
