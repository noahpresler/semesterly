var actions = require('../actions/update_timetables.js');


var tt_state = {
  school: "jhu",
  semester: "S",
  courses_to_sections: {},
  preferences: {
    'no_classes_before': false,
    'no_classes_after': false,
    'long_weekend': false,
    'grouped': false,
    'do_ranking': false,
    'try_with_conflicts': false
  }
}

module.exports = Reflux.createStore({
  listenables: [actions],

 /**
  * Update tt_state with new course roster
  * @param {object} new_course_with_section contains attributed id, section, removing
  * @return {void} does not return anything, just updates tt_state
  */
  updateCourses: function(new_course_with_section) {
    this.trigger({loading:true});

    var removing = new_course_with_section.removing;
    var new_course_id = new_course_with_section.id;
    var section = new_course_with_section.section;
    var c_to_s = $.extend(true, {}, tt_state.courses_to_sections); // deep copy of tt_state.courses_to_sections
    
    if (!removing) { // adding course
      if (tt_state.school == "jhu") {
        c_to_s[new_course_id] = {'L': '', 'T': '', 'P': '', 'C': new_course_with_section.section};
      }
      else if (tt_state.school == "uoft") {
        var locked_sections = {'L': '', 'T': '', 'P': '', 'C': ''} // this is what we want to send if not locking
        if (section) { // locking
          if (c_to_s[new_course_id] != null) {
            locked_sections = c_to_s[new_course_id]; // copy the old mapping
            // in case some sections were already locked for this course,
            // and now we're about to lock a new one.
          }
          locked_sections[section[0]] = section;
        }
        c_to_s[new_course_id] = locked_sections;
      }
    }
    else { // removing course
      delete c_to_s[new_course_id];
      if (Object.keys(c_to_s).length == 0) { // removed last course
          tt_state.courses_to_sections = {};
          this.trigger(this.getInitialState());
          return;  
      }
    }
    tt_state.courses_to_sections = c_to_s; // to make the POST request
    this.makeRequest();
  },

 /**
  * Update tt_state with new preferences
  * @param {string} preference: the preference that is being updated
  * @param new_value: the new value of the specified preference
  * @return {void} doesn't return anything, just updates tt_state
  */
  updatePreferences: function(preference, new_value) {
    this.trigger({loading: true});
    tt_state.preferences[preference] = new_value;
    this.makeRequest();
  },

  // Makes a POST request to the backend with tt_state
  makeRequest: function(index) {
    var ind = index;
    if (typeof index === 'undefined') {
      ind = 0;
    }
    $.post('/timetable/', JSON.stringify(tt_state), function(response) {
        if (response.length > 0) {
          this.trigger({
              timetables: response,
              courses_to_sections: tt_state.courses_to_sections,
              current_index: ind,
              loading: false
          });
        }
        else {
          this.trigger({loading: false});
        }
    }.bind(this));
  },

  getTimetableLink: function(current_index) {
    var link = window.location.host + "/" + current_index + "&";
    var c_to_s = tt_state.courses_to_sections;
    for (var course_id in c_to_s) {
      link += course_id;
      var mapping = c_to_s[course_id];
      for (var section_heading in mapping) { // i.e 'L', 'T', 'P', 'S'
        if (mapping[section_heading] != "") {
          link += "+" + mapping[section_heading]; // delimiter for sections locked
        }
      }
      link += "&"; // delimiter for courses
    }
    link = link.slice(0, -1);
    console.log(link);
  },

  loadPresetTimetable: function(url_data) {
    this.trigger({loading: true});
    var courses = url_data.split("&");
    var timetable_index = parseInt(courses.shift());
    var school = tt_state.school;
    for (var i = 0; i < courses.length; i++) {
      var c = parseInt(courses[i]);
      var course_info = courses[i].split("+");
      course_info.shift(); // removes first element
      tt_state.courses_to_sections[c] = {'L': '', 'T': '', 'P': '', 'C': ''};
      if (course_info.length > 0) {
        for (var j = 0; j < course_info.length; j++) {
          var section = course_info[j];
          if (school == "uoft") {
            tt_state.courses_to_sections[c][section[0]] = section;
          }
          else if (school == "jhu") {
            tt_state.courses_to_sections[c]['C'] = section;
          }
        }
      }
    }
    this.makeRequest(timetable_index);
  },

  getInitialState: function() {
    return {
      timetables: [], 
      courses_to_sections: {}, 
      current_index: -1, 
      loading: false};
  }
});
