TimetableActions = require('./actions/update_timetables');

module.exports = React.createClass({
	render: function() {
		return 	(
			<div className="school-list">
				<SchoolButton school="jhu"/>
				<SchoolButton school="uoft"/>
				<SchoolButton school="umd"/>
			</div>);
	},
});

var SchoolButton = React.createClass({
	render: function() {
		var classes = "school-picker school-" + this.props.school
		//expect logo to be in static/img/school_logos/[school name]_logo.png
		var logo_path = "/static/img/school_logos/" + this.props.school + "_logo.png"
		return (
				<div className={classes}
					onClick={this.setSchool(this.props.school)}>
					<img width="80%" src={logo_path}
						className="school-logo"/>
				</div>
			);
	},

	setSchool: function(new_school) {
		return (function() {
			TimetableActions.setSchool(new_school);
		}.bind(this));
	},
});
