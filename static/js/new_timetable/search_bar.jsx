var TimetableActions = require('./actions/update_timetables.js');
var TimetableStore = require('./stores/update_timetables.js');

var SearchResult = React.createClass({
  render: function() {
    var li_class = "search-result", icon_class = "fui-plus";
    if (this.props.in_roster) {
      li_class += " todo-done";
      icon_class = "fui-check";
    }
    var bodyw = $(window).width();    return (
      <li className={li_class} onMouseDown={this.props.toggleModal(this.props.id)}>
        <div className="todo-content">
          <h4 className="todo-name">
            {this.props.code}
          </h4>
          {this.props.name}
        </div>
        <span className={"search-result-action " + icon_class} 
          onMouseDown={this.toggleCourse}>
        </span>
      </li>
    );
  },

  toggleCourse: function(e) {
    var removing = this.props.in_roster;
    TimetableActions.updateCourses({id: this.props.id, section: '', removing: removing});
    e.preventDefault();  // stop input from triggering onBlur and thus hiding results
    e.stopPropagation(); // stop parent from opening modal
  },

});

module.exports = React.createClass({
  mixins: [Reflux.connect(TimetableStore)],

  getInitialState: function() {
    return {
      courses:[],
      results: [],
      focused: false,
    };
  },

  componentWillUpdate: function(new_props, new_state) {
    if (new_state.school != this.state.school) {
      this.getCourses(new_state.school);
    }

  },
  getCourses: function(school) {
    TimetableActions.setLoading();
    $.get("/courses/" + school + "/" + _SEMESTER, 
        {}, 
        function(response) {
          this.setState({courses: response});
          TimetableActions.setDoneLoading();

        }.bind(this)
    );
  },

  render: function() {
    var search_results_div = this.getSearchResultsComponent();
    return (
      <div id="search-bar">
        <div className="input-combine">
          <input 
            type="text" 
            placeholder="Search by code, title, description, professor, degree" 
            id="search-input" 
            ref="input" 
            onFocus={this.focus} onBlur={this.blur} 
            onInput={this.queryChanged}/>
          <button data-toggle="collapse" data-target="#menu-container" id="menu-btn">
            <div id="sliders">
              <span>
                <div className="box"></div>
              </span>
              <span>
                <div className="box"></div>
              </span>
              <span>
                <div className="box"></div>
              </span>
            </div>
          </button>
          {search_results_div}
        </div>
      </div>
    );
  },

  getSearchResultsComponent: function() {
    if (!this.state.focused || this.state.results.length == 0) {return null;}
    var i = 0;
    var search_results = this.state.results.map(function(r) {
      i++;
      var in_roster = this.state.courses_to_sections[r.id] != null;
      return (
        <SearchResult {...r} key={i} in_roster={in_roster} toggleModal={this.props.toggleModal}/>
      );
    }.bind(this));
    return (
      <div id="search-results-container">
        <div className="todo mrm">
            <ul id="search-results">
              {search_results}
            </ul>
          </div>
      </div>
    );
  },

  focus: function() {
    this.setState({focused: true});
  },

  blur: function() {
    this.setState({focused: false});
  },

  queryChanged: function(event) {
    var query = event.target.value.toLowerCase();
    var filtered = query.length <= 1 ? [] : this.filterCourses(query);
    this.setState({results: filtered});
  },

  isSubsequence: function(result,query) {
      result = query.split(" ").every(function(s) {
          if (result.indexOf(s) > -1) {
            return true;
          } else {
            return false;
          }
      }.bind(this));
      return result;
  },

  filterCourses: function(query) {
    var opt_query = query.replace("intro","introduction")
    that = this
    var results = this.state.courses.filter(function(c) {
      return (that.isSubsequence(c.name.toLowerCase(),query) || 
             that.isSubsequence(c.name.toLowerCase(),opt_query) ||
             c.code.toLowerCase().indexOf(opt_query) > -1 ||
             c.name.toLowerCase().indexOf(opt_query) > -1 ||
             c.name.toLowerCase().indexOf(query) > -1);
    });
    return results;
  },



});
