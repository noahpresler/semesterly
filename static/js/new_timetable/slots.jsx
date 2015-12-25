
//             [blue,    bright red,  purple,    teal,       green,    yellow,      pink,      grey]
var colour_list = ["#449DCA", "#fb6b5b", "#8A7BDD", "#26ADA1", "#8ec165", "#f0ad4e", "#FF6699", "#6E6E6E"];
// flat UI colours:
// colour_list = ["#3498db", "#e74c3c", "#8e44ad", "#1abc9c", "#2ecc71", "#f39c12"]
// how big a slot of half an hour would be, in pixels
var half_hour_height = 30;

var slot_attributes = {};
var slot_ids = [];


var Slot = React.createClass({
    render: function() {
        var slot_style = this.getSlotStyle();
        return (
            <div className="fc-time-grid-event fc-event slot" style={slot_style}>
                <div className="fc-content">
                  <div className="fc-time">
                    <span>{this.props.start_time} – {this.props.end_time}</span>
                  </div>
                  <div className="fc-title">{this.props.title}</div>
                </div>
            </div>
        );
    },

    getSlotStyle: function() {
        var start_hour   = parseInt(this.props.start_time.split(":")[0]),
            start_minute = parseInt(this.props.start_time.split(":")[1]),
            end_hour     = parseInt(this.props.end_time.split(":")[0]),
            end_minute   = parseInt(this.props.end_time.split(":")[1]);

        var duration = end_hour*60 + end_minute - (start_hour*60 + start_minute) + (end_hour - start_hour - 1);
        var top = (start_hour - 8)*62;
        return {top: top, height: duration};

    },

});

var SlotManager = React.createClass({
    render: function() {
        return (
            <table>
              <tbody>
                <tr>
                  <td className="fc-axis"></td>
                  <td>
                    <div className="fc-event-container">
                        <Slot start_time={"8:00"} end_time={"9:00"} title={"Hello"}/>
                    </div>
                  </td>
                  <td>
                    <div className="fc-event-container" >
                        

                    </div>
                  </td>
                  <td>
                    <div className="fc-event-container">
                        <Slot start_time={"14:00"} end_time={"15:15"} title={"Meeting"}/>
                    </div>
                  </td>
                  <td>
                    <div className="fc-event-container">
                      
                    </div>
                  </td>
                  <td>
                    <div className="fc-event-container"></div>
                  </td>
                </tr>
              </tbody>
            </table>
        );
    }
});

ReactDOM.render(
  <SlotManager />,
  document.getElementById('slot-manager')
);
