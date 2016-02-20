var course_actions = require('../actions/course_actions.js');

module.exports = Reflux.createStore({
  listenables: [course_actions],

  getCourseId: function(school, sem, code) {
    this.trigger({code_loading: true});
    $.get("/courses/"+ school + "/" + sem +  "/code/" + code, 
         {}, 
         function(response) {
            this.trigger({code_loading: false, share_url_id: response});
         }.bind(this)
    );

  },

  getInitialState: function() {
    return {share_url_id: null, code_loading: true};
  }
});
