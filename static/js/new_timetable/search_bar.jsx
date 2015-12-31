var actions = require('./actions/update_timetables.js');

var SearchResult = React.createClass({
  render: function() {
    var li_class = "search-result", icon_class = "fui-plus";
    if (this.props.in_roster) {
      li_class += " todo-done";
      icon_class = "fui-check";
    }
    return (
      <li className={li_class} onMouseDown={this.showModal}>
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

  showModal: function(e) {
    this.props.toggleModal()();
  },

  toggleCourse: function(e) {
    actions.updateTimetables();
    e.preventDefault();  // stop input from triggering onBlur and thus hiding results
    e.stopPropagation(); // stop parent from opening modal
  },

});

module.exports = React.createClass({

  getInitialState: function() {
    return {
      in_roster: [],
      results: [],
      focused: false,
    };
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
            <i className="fa fa-bars fa-2x"></i>
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
      var in_roster = r.code.indexOf("61") > -1;
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

  filterCourses: function(query) {
    var results = courses.filter(function(c) {
      return c.code.toLowerCase().indexOf(query) > -1 ||
             c.name.toLowerCase().indexOf(query) > -1
    });
    return results;
  },


});
