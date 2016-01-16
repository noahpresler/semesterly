
AnalyticsPage = React.createClass({displayName: "AnalyticsPage",
	getInitialState: function() {
		return {validated: false, uoft_generated:0, jhu_generated:0};
	},

	render: function() {
		if (!this.state.validated) {return React.createElement("div", null);}
		return (React.createElement("div", null, 
			React.createElement("h1", null, "Timetables Generated "), 
			React.createElement("div", {className: "school-timetables"}, React.createElement("h4", null, "UofT"), this.state.uoft_generated), 
			React.createElement("div", {className: "school-timetables"}, React.createElement("h4", null, "JHU"), this.state.jhu_generated)
			));

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
			console.log(response);
			this.setState({
				uoft_generated: response.uoft_generated, 
				jhu_generated: response.jhu_generated
			});
		}.bind(this)));
	},
		
});


ReactDOM.render(
  React.createElement(AnalyticsPage, null),
  document.getElementById('analytics-container')
);
