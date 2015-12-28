var ControlBar = require('./control_bar');
var Timetable = require('./timetable');

module.exports = React.createClass({

  render: function() {
    return (
      <div id="root">
        <div id="control-bar-container">
          <ControlBar />
        </div>

        <div id="cal-container">
          <Timetable />
        </div>
      </div>
    );
  },
});
