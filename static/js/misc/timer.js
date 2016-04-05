var TimerBox = React.createClass({displayName: "TimerBox",
	render: function() {
		return (React.createElement("div", {className: "timer-box"}, 
			React.createElement("div", {className: "timer-remaining"}, 
				React.createElement("p", {className: "timer-text"}, 
					this.props.remaining
				)
			), 
			React.createElement("div", {className: "timer-label"}, 
				React.createElement("p", {className: "label-text"}, 
					this.props.label
				)			
			)

		));
	},
});

var SemesterlyTimer = React.createClass({displayName: "SemesterlyTimer",
	getInitialState: function() {
		return this.getTimeRemaining();
	},
	render: function() {
		if (this.state.total_seconds == 0) {
			this.redirect();
		}
		return (
			React.createElement("div", null, 
				React.createElement("div", {className: "semesterly-timer"}, 
					React.createElement("h1", {className: "timer-header"}, this.props.event), 
					React.createElement(TimerBox, {label: "Days", remaining: this.state.days}), 
					React.createElement(TimerBox, {label: "Hours", remaining: this.state.hours}), 
					React.createElement(TimerBox, {label: "Minutes", remaining: this.state.minutes}), 
					React.createElement(TimerBox, {label: "Seconds", remaining: this.state.seconds})
		     	    
				), 
				React.createElement("div", {className: "go"}, 
	        			React.createElement("a", {href: "http://semester.ly"}, "Back to Semester.ly", 
	        			React.createElement("i", {className: "fa fa-long-arrow-right go-arrow"})

	        			)

      			)
      		)
			);
	},
	componentDidMount: function() {
		setInterval(this.updateTime, 1000);
	},

	getTimeRemaining: function() {
 		var t = Date.parse(this.props.deadline) - Date.parse(new Date());
	  	var seconds = Math.floor( (t/1000) % 60 );
	  	var minutes = Math.floor( (t/1000/60) % 60 );
  		var hours = Math.floor( (t/(1000*60*60)) % 24 );
	  	var days = Math.floor( t/(1000*60*60*24) );
	  	return {
	  		'total_seconds': Math.max(t/1000, 0),
	    	'days': Math.max(days,0),
	    	'hours': Math.max(hours,0),
	    	'minutes': Math.max(minutes,0),
	    	'seconds': Math.max(seconds, 0)
	  	};
	},

	updateTime: function() {
		this.setState(this.getTimeRemaining());
	},
	redirect: function() {
		window.location.href="http://semester.ly";
	},
});

ReactDOM.render(
 	React.createElement(SemesterlyTimer, {
 		deadline: "April 5 2016 07:00:00 GMT-04:00", 
 		event: "Rising Junior Registration Begins In:"}),
  document.getElementById('page')
);
