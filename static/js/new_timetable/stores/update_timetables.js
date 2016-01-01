var actions = require('../actions/update_timetables.js');


var obj = {
  school: "jhu",
  semester: "F",
  course_to_section: {},
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
  course_to_section: {},

  updateTimetables: function(new_course_id) {
    var c_to_s = $.extend(true, {}, this.course_to_section); // deep copy of this.course_to_section
    if (c_to_s[new_course_id] == null) { // adding course
      c_to_s[new_course_id] = [];
    }
    else { // removing course
      delete c_to_s[new_course_id];
      if (Object.keys(c_to_s).length == 0) { // removed last course
          this.course_to_section = {};
          this.trigger(this.getInitialState());
          return;  
      }
    }

    obj.course_to_section = c_to_s; // to make the POST request
    $.post('/timetable/', JSON.stringify(obj), function(response) {
        if (response.length > 0) {
            this.course_to_section = c_to_s;
            this.trigger({
                timetables: response,
                course_to_section: this.course_to_section,
                current_index: 0
            });
        }
    }.bind(this));
  },

  getInitialState: function() {
    return {timetables: [], course_to_section: {}, current_index: -1};
  }
});
