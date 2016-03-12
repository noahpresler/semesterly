TimetableActions = require('./actions/update_timetables');

module.exports = React.createClass({

	render: function() {
		return 	(
			<div className="school-list">
				<div className="school-picker school-jhu" 
					onClick={this.setSchool("jhu")}>
					<img src="/static/img/school_logos/jhu_logo.png" 
						className="school-logo"/>
				</div>
				<div className="school-picker school-uoft" 
					onClick={this.setSchool("uoft")}>
					<img src="/static/img/school_logos/uoft_logo.png" 
						className="school-logo"/>
				</div>
				<div className="school-picker school-umd"
					onClick={this.setSchool("umd")}>
					<img src="/static/img/school_logos/umd_logo_white.png"
						className="school-log"/>
				</div>
			</div>);
	},

	setSchool: function(new_school) {
		return (function() {
			TimetableActions.setSchool(new_school);
		}.bind(this));
	},

});

