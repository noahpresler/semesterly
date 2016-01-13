TimetableActions = require('./actions/update_timetables');

module.exports = React.createClass({

	render: function() {
		return 	(
			<div className="school-list">
				<div className="school-picker school-jhu">
					<img src="/static/img/school_logos/jhu_logo.png" 
						className="school-logo"
			             onClick={this.setSchool("jhu")}/>
				</div>
				<div className="school-picker school-uoft">
					<img src="/static/img/school_logos/uoft_logo.png" 
						className="school-logo"
			             onClick={this.setSchool("uoft")}/>
				</div>
			</div>);
	},

	setSchool: function(new_school) {
		return (function() {
			TimetableActions.setSchool(new_school);
		}.bind(this));
	},

});

