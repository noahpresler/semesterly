var TimerBox = React.createClass({
	render: function() {
		return (<div className="timer-box">
			<div className="timer-remaining">
				<p className="timer-text">
					{this.props.remaining}
				</p>
			</div>
			<div className="timer-label">
				<p className="label-text">
					{this.props.label}
				</p>			
			</div>

		</div>);
	},
});

var SemesterlyTimer = React.createClass({
	getInitialState: function() {
		return this.getTimeRemaining();
	},
	render: function() {
		if (this.state.total_seconds == 0) {
			this.redirect();
		}
		return (
			<div>
				<div className="semesterly-timer">
					<h1 className="timer-header">{this.props.event}</h1>
					<TimerBox label="Days" remaining={this.state.days} />
					<TimerBox label="Hours" remaining={this.state.hours} />
					<TimerBox label="Minutes" remaining={this.state.minutes} />
					<TimerBox label="Seconds" remaining={this.state.seconds} />
		     	    
				</div>
				<div className="go">
	        			<a href="http://semester.ly">Plan Your Schedule!
	        			<i className="fa fa-long-arrow-right go-arrow"></i>

	        			</a>

      			</div>
      		</div>
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
 	<SemesterlyTimer 
 		deadline="April 4 2016 07:00:00 GMT-04:00"
 		event="JHU Senior Registration"/>,
  document.getElementById('page')
);
