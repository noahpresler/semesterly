
AnalyticsPage = React.createClass({
	getInitialState: function() {
		return {validated: false, uoft_generated:0, jhu_generated:0};
	},

	render: function() {
		if (!this.state.validated) {return <div></div>;}
		return (<div>
			<h1>Timetables Generated</h1>
			<div className="school-timetables"><h4>UofT</h4>{this.state.uoft_generated}</div>
			<div className="school-timetables"><h4>JHU</h4>{this.state.jhu_generated}</div>
			</div>);

	},

	componentDidMount: function() {
		var verifier = prompt("Please let us know how you came to this page.");

		$.get("/reason", {x: verifier}, (function(response) {
			if (response != "success") {
			    window.location.href="http://semester.ly";
		    }
		    else {
		    	this.setState({validated: true});
		    	this.getInfo();
		    }
		}.bind(this)));
	},

	getInfo: function() {
		$.get("/analytics/get_num_generated", {}, (function(response) {
			this.setState({
				uoft_generated: response.uoft_generated, 
				jhu_generated: response.jhu_generated
			});
		}.bind(this)));
	},
		
});


ReactDOM.render(
  <AnalyticsPage />,
  document.getElementById('analytics-container')
);
