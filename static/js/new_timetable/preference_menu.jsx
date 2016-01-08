var TimetableActions = require('./actions/update_timetables.js');
var TimetableStore = require('./stores/update_timetables.js');

var BinaryPreference = React.createClass({
  mixins: [Reflux.connect(TimetableStore)],

  render: function() {
    var toggle_label = "cmn-toggle-" + this.props.toggle_id;
    return (
      <div className="preference-item">
        <div className="preference-text">
          <li> {this.props.text} </li>
        </div>
        <div className="preference-toggle">
          <div className="switch">
            <input ref="checkbox_elem" id={toggle_label} 
                   className="cmn-toggle cmn-toggle-round" type="checkbox" 
                   onClick={this.togglePreference}/>
            <label htmlFor={toggle_label}></label>
          </div>
        </div>
      </div>
    );
  },

  togglePreference: function() {
    var new_value = this.refs.checkbox_elem.checked;
    TimetableActions.updatePreferences(this.props.name, new_value);
  }
});

module.exports = React.createClass({
  current_toggle_id: 0,

  render: function() {
    return (
      <div id="menu-container" className="collapse">
        <div className="navbar-collapse" >
          <ul className="nav navbar-nav" id="menu">
            <li>
              <a href="#fakelink">Preferences</a>
              <ul>
                <BinaryPreference text="Avoid early classes" 
                                  name="no_classes_before"
                                  toggle_id={this.get_next_toggle_id()} />
                <BinaryPreference text="Avoid late classes" 
                                  name="no_classes_after"
                                  toggle_id={this.get_next_toggle_id()} />
                <BinaryPreference text="Allow conflicts" 
                                  name="try_with_conflicts"
                                  toggle_id={this.get_next_toggle_id()} />
              </ul>
            </li>
            <li><a href="#fakelink">Profile</a></li>
            <ul>
              <div className="profile-text">
                <li>Favorites</li>
              </div>
            </ul>
            <ul>
              <div className="profile-text">
                <li>Friends</li>
              </div>
            </ul>
            <ul>
              <div className="profile-text">
                <li>Sign Out</li>
              </div>
            </ul>
          </ul>
        </div>
      </div>
    );
  },

  get_next_toggle_id: function() {
    this.current_toggle_id += 1
    return this.current_toggle_id;
  }

});