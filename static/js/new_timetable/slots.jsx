
//             [blue,    bright red,  purple,    teal,       green,    yellow,      pink,      grey]
var colour_list = ["#449DCA", "#fb6b5b", "#8A7BDD", "#26ADA1", "#8ec165", "#f0ad4e", "#FF6699", "#6E6E6E"];
// flat UI colours:
// colour_list = ["#3498db", "#e74c3c", "#8e44ad", "#1abc9c", "#2ecc71", "#f39c12"]
// how big a slot of half an hour would be, in pixels
var HALF_HOUR_HEIGHT = 30;

var test_timetables = 
[ 
    {
        code: 'CSC108H1',
        lecture_section: 'L0101',
        slots: [
                {
                    code: 'CSC108H1',
                    lecture_section: 'L0101',
                    day: 'Monday',
                    start_time: '14:00',
                    end_time: '16:00'
                },
                {
                    code: 'CSC108H1',
                    lecture_section: 'L0101',
                    day: 'Wednesday',
                    start_time: '10:00',
                    end_time: '12:15'
                },
            ],

    },
    {
        code: 'CSC148H1',
        lecture_section: 'L5001',
        slots: [
                {
                    code: 'CSC148H1',
                    lecture_section: 'L5001',
                    day: 'Tuesday',
                    start_time: '13:00',
                    end_time: '15:20'
                },
                {
                    code: 'CSC148H1',
                    lecture_section: 'L5001',
                    day: 'Friday',
                    start_time: '9:45',
                    end_time: '10:45'
                },
            ],
    },    
];

var Slot = React.createClass({
    render: function() {
        var slot_style = this.getSlotStyle();
        return (
            <div className="fc-time-grid-event fc-event slot" style={slot_style}>
                <div className="fc-content">
                  <div className="fc-time">
                    <span>{this.props.course.start_time} – {this.props.course.end_time}</span>
                  </div>
                  <div className="fc-title">{this.props.course.code}</div>
                </div>
            </div>
        );
    },

    getSlotStyle: function() {
        var start_hour   = parseInt(this.props.course.start_time.split(":")[0]),
            start_minute = parseInt(this.props.course.start_time.split(":")[1]),
            end_hour     = parseInt(this.props.course.end_time.split(":")[0]),
            end_minute   = parseInt(this.props.course.end_time.split(":")[1]);

        var top = (start_hour - 8)*62 + start_minute;
        var bottom = (end_hour - 8)*62 + end_minute;
        var height = bottom - top - 2;
        return {top: top, height: height};
    },

});

var SlotManager = React.createClass({
    getInitialState: function() {
        var slots_by_day = {
            'Monday': [],
            'Tuesday': [],
            'Wednesday': [],
            'Thursday': [],
            'Friday': []
        };
        for (var timetable in test_timetables) {
            var tt = test_timetables[timetable];
            for (var slot_id in tt.slots) {
                var slot = tt.slots[slot_id];
                slots_by_day[slot.day].push(slot);
            }
        }
        return {slots_by_day: slots_by_day};
    },

    render: function() {
        var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
        var x = this.state.slots_by_day;
        var all_slots = days.map(function(day) {
            var day_slots = x[day].map(function(slot) {
                return <Slot course={slot} />
            });
            return (
                    <td>
                        <div className="fc-event-container">
                            {day_slots}
                        </div>
                    </td>
            );
        });
        return (
            <table>
              <tbody>
                <tr>
                  <td className="fc-axis"></td>
                  {all_slots}
                </tr>
              </tbody>
            </table>
        );
    },

    componentDidMount: function() {
        var days = {1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri'};
        var d = new Date();
        var selector = ".fc-" + days[d.getDay()];
        $(selector).addClass("fc-today");
    },

});

ReactDOM.render(
  <SlotManager />,
  document.getElementById('slot-manager')
);
