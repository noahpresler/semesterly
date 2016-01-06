var Loader = require('./loader');
var course_info_store = require('./stores/course_info');

module.exports = React.createClass({
	mixins: [Reflux.connect(course_info_store)],

	render: function() {
		var loader = this.state.loading ? <Loader /> : null;
		var header = this.state.loading ? null : this.getHeader()
		var description = this.state.loading ? null : this.getDescription()
		var evaluations = this.state.loading ? null : this.getEvaluations()
		var recomendations = this.state.loading ? null : this.getRecomendations()
		var textbooks = this.state.loading ? null : this.getTextbooks()
		var sections = this.state.loading ? null : this.getSections()
		return (
			<div id="modal-content">
                {loader}
                {header}
                {description}
                {evaluations}
                {sections}
                {textbooks}
                {recomendations}
            </div>);
	},

	getHeader: function() {
		var header = (<div className="modal-header">
			<div id="name">{this.state.course_info.name}</div>
			<div id="code">{this.state.course_info.code}</div>
		</div>)
		return header
	},

	getDescription: function() {
		var description = 
			(<div className="modal-entry" id="course-description">
				<h6>Description:</h6>
				{this.state.course_info.description}
			</div>)
		return description
	},

	getEvaluations: function() {
		var evaluations = 
			(<div className="modal-entry" id="course-evaluations">
				<h6>Course Evaluations:</h6>
			</div>)
		return evaluations
	},

	getRecomendations: function() {
		var recomendations = 
			(<div className="modal-entry" id="course-recomendations">
				<h6>Courses You Might Like:</h6>
			</div>)
		return recomendations
	},

	getTextbooks: function() {
		var textbooks = 
			(<div className="modal-entry" id="course-textbooks">
				<h6>Textbooks:</h6>
			</div>)
		return textbooks
	},

	getSections: function() {
		var sections = 
			(<div className="modal-entry" id="course-sections">
				<h6>Course Sections:</h6>
			</div>)
		return sections
	},


});

