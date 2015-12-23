

var LiveUserData = React.createClass({
	mixins: [BootstrapModalMixin],
	
	getInitialState: function() {
		this.updateData();
		return {data:[]};
	},
				

	render: function() {
		var count = 0;
		data_display = this.state.data.map(function(entry) {
			count += 1;
		    return (
		    	<tr>
		    	  <td>{count}</td>
		    	  <td>{entry.ip}</td>
		    	  <td>{entry.location}</td>
		    	  <td>{entry.time_arrived}</td>
		    	</tr>
		    );
		}.bind(this));
		var s = {width: '10px'};
		var s2 = {width: '40px'};
		return (
	<div className="modal fade">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <strong></strong>
          </div>
          <div className="modal-body">
            
			<div className="box">
                <div className="box-header">
                  <h3 className="box-title">Live User Data</h3>
                </div>
                <div className="box-body no-padding">
                  <table className="table table-striped">
                    <tbody>
                    <tr>
                      <th style={s}>#</th>
                      <th>IP</th>
                      <th>Location</th>
                      <th>Time Arrived</th>
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

	updateData: function() {
		$.get("/live_user_data", {}, 
									_.bind(function(response) {
			this.setState({data:response});	
		}, this));
	},

});
