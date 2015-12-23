
var TimetableData = React.createClass({
  mixins: [BootstrapModalMixin],
 
  getInitialState: function() {
    return {ip: "", data:[]};
  },

  render: function() {
    var s={width:'900px'};
    var s2 = {marginLeft: '5px'}
    var count = 0;
    var data_display = this.state.data.map(function(entry) {
      count += 1;
        return (
          <tr>
            <td>{count}</td>
            <td>{entry.ip}</td>
            <td>{entry.time}</td>
            <td>{entry.location}</td>
            <td style={s}>{entry.courses}</td>
            <td>{entry.conflict}</td>
          </tr>
        );
    }.bind(this));
        return (
      <div className="modal fade">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <strong>Filter by IP: </strong>
                <input style={s2} onInput={this.newIP}/>
              </div>
              <div className="modal-body">
                
          <div className="box">
                    <div className="box-header">
                      <h3 className="box-title">Recent Timetables Created</h3>
                    </div>
                    <div className="box-body no-padding">
                      <table className="table table-striped">
                        <tbody>
                        <tr>
                          <th>#</th>
                          <th>IP</th>
                          <th style={s}>Time</th>
                          <th>Location</th>
                          <th style={s}>Courses</th>
                          <th>Conflict?</th>
                        </tr>
                        {data_display}
                        
                      </tbody></table>
                    </div>
                  </div>
              </div>
              <div className="modal-footer">
              </div>
            </div>
          </div>
        </div>);
  },
  newIP: function(event) {
    var inp = event.target.value;
      this.setState({ip: inp});
      this.updateData();

  },

  updateData: function() {
    $.get("/timetable_data", {ip:this.state.ip, school: this.props.school}, 
                  _.bind(function(response) {
      this.setState({data:response[0]['recent_tt_data']}); 
    }, this));
  },

  exitModal: function() {
    this.props.handleCloseModal();
  },


  

});
