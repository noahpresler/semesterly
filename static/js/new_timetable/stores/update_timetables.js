var actions = require('../actions/update_timetables.js');


var obj = {
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
  courses_to_sections: {},

  updateTimetables: function(new_course_with_section) {
    this.trigger({loading:true});

    var removing = new_course_with_section.removing;
    var new_course_id = new_course_with_section.id;
    var c_to_s = $.extend(true, {}, this.courses_to_sections); // deep copy of this.courses_to_sections
    if (!removing) { // adding course
      c_to_s[new_course_id] = {'L': '', 'T': '', 'P': '', 'C': new_course_with_section.section};
    }
    else { // removing course
      delete c_to_s[new_course_id];
      if (Object.keys(c_to_s).length == 0) { // removed last course
          this.courses_to_sections = {};
          this.trigger(this.getInitialState());
          return;  
      }
    }
    obj.courses_to_sections = c_to_s; // to make the POST request
    $.post('/timetable/', JSON.stringify(obj), function(response) {
        if (response.length > 0) {
            this.courses_to_sections = c_to_s;
            this.trigger({
                timetables: response,
                courses_to_sections: this.courses_to_sections,
                current_index: 0,
                loading: false
            });
        }
        else {
          this.trigger({loading: false});
        }
    }.bind(this));
  },

  getInitialState: function() {
    return {
      timetables: [], 
      courses_to_sections: {}, 
      current_index: -1, 
      loading: false};
  }
});
