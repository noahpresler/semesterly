

var AnalyticsDashboard = React.createClass({
	getInitialState: function() {
		setInterval(this.getAnalyticsData, 10000);
		this.getAnalyticsData();
		var def = "";
		return {
			validated: false,
			loading: true,
			uoft_tts: def, 
			hopkins_tts: def,
			bounce_rate: def, 
			unique_users: def, 
			users_live: def};
	},

	componentWillMount: function() {
		var var_x = prompt("Please let us know how you came to this page.");

		$.get("/reason", {x: var_x}, _.bind(function(response) {
			if (response != "success") {
			    location = "404";
		    }
		    else {
		    	this.setState({validated: true});
		    	$('.skin-blue').removeClass('page_body');
		    }
		    
		}, this));
	},

	render: function() {
		if (!this.state.validated) {return null;}
		var uoft_tt_data = "...";
		var hopkins_tt_data = "..."
		var bounce_rate_data = "...";
		var unique_users_data = "...";
		var users_live_data = "...";
		if (!this.state.loading) {
			uoft_tt_data = this.state.uoft_tts;
			hopkins_tt_data = this.state.hopkins_tts;
			bounce_rate_data = this.state.bounce_rate;
			unique_users_data = this.state.unique_users;
			users_live_data = this.state.users_live;
		}
		return (
			<div>
				<LiveUserData show={false}
						  ref="datamodal"
						  handleCloseModal={this.handleCloseLiveModal}>
				</LiveUserData>
				<TimetableData show={false}
						  school="uoft"
						  ref="uoft_timetables"
						  handleCloseModal={this.handleCloseTimetableModal}>
				</TimetableData>
				<TimetableData show={false}
						  school="hopkins"
						  ref="hopkins_timetables"
						  handleCloseModal={this.handleCloseTimetableModal}>
				</TimetableData>
			  <section className="content-header">
			    <h1>
			      Semester.ly 
			      <small>Admin Analytics Panel</small>
			    </h1>
			    <ol className="breadcrumb">
			      <li><a href="#"><i className="fa fa-dashboard"></i> Home</a></li>
			      <li className="active">Dashboard</li>
			    </ol>
			  </section>

			  <section className="content">
			    
			    <div className="row">
			      <div className="col-lg-3 col-xs-6">
			        
			        <div className="small-box bg-aqua">
			          <div className="inner">
			            <h3>{uoft_tt_data}</h3>
			            <p>UofT Timetables</p>
			          </div>
			          <div className="icon">
			            <i className="ion ion-bag"></i>
			          </div>
			          <a href="#" className="small-box-footer" onClick={this.getUofTTimetableData}>More info <i className="fa fa-arrow-circle-right"></i></a>
			        </div>
			      </div>
			      <div className="col-lg-3 col-xs-6">
			        
			        <div className="small-box bg-aqua">
			          <div className="inner">
			            <h3>{hopkins_tt_data}</h3>
			            <p>Hopkins Timetables</p>
			          </div>
			          <div className="icon">
			            <i className="ion ion-bag"></i>
			          </div>
			          <a href="#" className="small-box-footer" onClick={this.getHopkinsTimetableData}>More info <i className="fa fa-arrow-circle-right"></i></a>
			        </div>
			      </div>

			      <div className="col-lg-3 col-xs-6">
			        
			        <div className="small-box bg-yellow">
			          <div className="inner">
			            <h3>{unique_users_data}</h3>
			            <p>Unique Users</p>
			          </div>
			          <div className="icon">
			            <i className="ion ion-person-add"></i>
			          </div>
			          <a href="#" className="small-box-footer">More info <i className="fa fa-arrow-circle-right"></i></a>
			        </div>
			      </div>
			      <div className="col-lg-3 col-xs-6">
			        <div className="small-box bg-red">
			          <div className="inner">
			            <h3>{users_live_data}</h3>
			            <p>Users Live</p>
			          </div>
			          <div className="icon">
			            <i className="ion ion-pie-graph"></i>
			          </div>
			          <a href="#" className="small-box-footer" onClick={this.getLiveUserData}>More info <i className="fa fa-arrow-circle-right"></i></a>
			        </div>
			      </div>
			    </div>
			    
			  </section>
			</div>



		);


	},
	handleShowModal: function() {
	    this.refs.modal.show();
	    this.refs.modal.updateData();
	},
	 
	handleExternalHide: function() {
	},
	 
	handleCloseLiveModal: function() {
	    this.refs.datamodal.hide();
	},
	handleCloseTimetableModal: function() {
	    this.refs.timetablemodal.hide();
	},
	getLiveUserData: function() {
		this.refs.datamodal.show();
		this.refs.datamodal.updateData();
	},
	getUofTTimetableData: function() {
		this.refs.uoft_timetables.show();
		this.refs.uoft_timetables.updateData();
	},
	getHopkinsTimetableData: function() {
		this.refs.hopkins_timetables.show();
		this.refs.hopkins_timetables.updateData();
	},

	getAnalyticsData: function() {
		this.setState({loading: true});
		$.get("/analytics_data", {}, 
									_.bind(function(response) {
			response = response[0];
		    this.setState({
		    	loading: false,
		    	uoft_tts: response.uoft_tts, 
		    	hopkins_tts: response.hopkins_tts, 
		    	bounce_rate: response.bounce_rate, 
		    	unique_users: response.unique_users, 
		    	users_live: response.users_live});
		    
		}, this));

	},


});






React.renderComponent(
  <AnalyticsDashboard />,
  document.getElementById('dashboard-wrapper')
);