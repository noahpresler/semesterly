var SearchBar = require('./search_bar');
var PreferenceMenu = require('./preference_menu');

module.exports = React.createClass({

  render: function() {
    return (
      <div id="control-bar">
        <div id="search-bar-container">
          <SearchBar {...this.props}/>
        </div>
        <PreferenceMenu />
      </div>

    );
  },
});
