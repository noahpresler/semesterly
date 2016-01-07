var Loader = require('./loader');
var course_info_store = require('./stores/course_info');
var EvaluationManager = require('./evaluations.jsx');

module.exports = React.createClass({
	mixins: [Reflux.connect(course_info_store)],

	render: function() {
		var loader = this.state.loading ? <Loader /> : null;
		var header = this.state.loading ? null : this.getHeader()
		var description = this.state.loading ? null : this.getDescription()
		var evaluations = this.state.loading ? null : this.getEvaluations()
		var recomendations = this.state.loading ? null : this.getRecomendations()
		var textbooks =this.state.loading ? null : this.getTextbooks()
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
		return <EvaluationManager eval_info={this.state.course_info.eval_info} />
	},

	getRecomendations: function() {
		var related = this.state.course_info.related_courses.slice(0,3).map(function(rc) {
            return (
            	<div id="recomendation">
            		<div id="center-wrapper">
	            		<div id="rec-wrapper">
		            		<div id="name">{rc.name}</div>
		            		<div id="code">{rc.code}</div>
		            	</div>
		            </div>
            	</div>)
        }.bind(this));
		var recomendations = this.state.course_info.related_courses.length == 0 ? null :
			(<div className="modal-entry">
				<h6>Courses You Might Like:</h6>
				<div id="course-recomendations">
					{related}
				</div>
			</div>)
		return recomendations
	},

	expandRecomendations: function() {

	},

	getTextbooks: function() {
		var textbook_elements = this.state.course_info.textbook_info[0].textbooks.map(function(tb) {
            return (
            	<div className="textbook">
            		<img height="125" src={tb.image_url}/>
            		<h6>{tb.title}</h6>
            		<div>{tb.author}</div>
            		<div>ISBN:{tb.isbn}</div>
            		<a href={tb.detail_url} target="_blank">
            			<img src="https://images-na.ssl-images-amazon.com/images/G/01/associates/remote-buy-box/buy5._V192207739_.gif" width="120" height="28" border="0"/>
            		</a>
            	</div>)
        }.bind(this));
		var textbooks = this.state.course_info.textbook_info[0].textbooks.length == 0 ? (<div id="empty-intro">No textbooks yet for this course</div>) :
				(<div id="textbooks">
	            	{textbook_elements}
	            </div>)
		var ret = 
			(<div className="modal-entry" id="course-textbooks">
				<h6>Textbooks:</h6>
				{textbooks}
			</div>)
		return ret
	},

	getSections: function() {
		// var F = this.state.course_info.sections_S.map(function(f){
		// 	return (<div>
		// 		{f}
		// 	</div>)
		// }.bind(this));
		// var S = this.state.course_info.sections_F.map(function(s){
		// 	return (<div>
		// 		{s}
		// 	</div>)
		// }.bind(this));
		// var sections = 
		// 	(<div className="modal-entry" id="course-sections">
		// 		<h6>Course Sections:</h6>
		// 		{F}
		// 		{S}
		// 	</div>)
		// return sections
		return null
	},


});

