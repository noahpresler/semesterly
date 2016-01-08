var SearchBar = require('./search_bar');
var TimetableActions = require('./actions/update_timetables.js');
var TimetableStore = require('./stores/update_timetables.js');

module.exports = React.createClass({
  mixins: [Reflux.connect(TimetableStore)],

  render: function() {
    return (
      <div id="control-bar">
        <div id="search-bar-container">
          <SearchBar toggleModal={this.props.toggleModal} />
        </div>
        <div id="menu-container" className="collapse">
          <div className="navbar-collapse" >
            <ul className="nav navbar-nav" id="menu">
              <li>
                <a href="#fakelink">Preferences</a>
                <ul>
                  <div className="preference-item">
                    <div className="preference-text">
                      <li> Avoid early classes </li>
                    </div>
                    <div className="preference-toggle">
                      <div className="switch">
                        <input id="cmn-toggle-1" defaultChecked className="cmn-toggle cmn-toggle-round" type="checkbox" />
                        <label htmlFor="cmn-toggle-1"></label>
                      </div>
                    </div>
                  </div>
                  <div className="preference-item">
                    <div className="preference-text">
                      <li> Avoid late classes </li>
                    </div>
                    <div className="preference-toggle">
                      <div className="switch">
                        <input id="cmn-toggle-2" defaultChecked className="cmn-toggle cmn-toggle-round" type="checkbox" />
                        <label htmlFor="cmn-toggle-2"></label>
                      </div>
                    </div>
                  </div>
                  <div className="preference-item">
                    <div className="preference-text">
                      <li> Allow conflicts </li>
                    </div>
                    <div className="preference-toggle">
                      <div className="switch">
                        <input id="cmn-toggle-3" defaultChecked className="cmn-toggle cmn-toggle-round" type="checkbox" onClick={TimetableActions.updatePreferences}/>
                        <label htmlFor="cmn-toggle-3"></label>
                      </div>
                    </div>
                  </div>
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
      </div>

    );
  },
});
