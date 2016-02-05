var Loader = require('./loader');
var CourseInfoStore = require('./stores/course_info');
var EvaluationManager = require('./evaluations.jsx');
var TimetableActions = require('./actions/update_timetables.js');
var UpdateTimetablesStore = require('./stores/update_timetables.js');
var CourseActions = require('./actions/course_actions');
var SectionSlot = require('./section_slot.jsx');
var SideScroller = require('./side_scroller.jsx');


module.exports = React.createClass({
	mixins: [Reflux.connect(CourseInfoStore)],

	render: function() {
		var loading = this.state.info_loading;
		var loader = loading ? <Loader /> : null;
		var header = loading ? null : this.getHeader();
		var description = loading ? null : this.getDescription();
		var evaluations = loading ? null : this.getEvaluations();

		var recomendations = loading ? null : this.getRecomendations();
		var textbooks = loading ? null : this.getTextbooks();
		var sections = loading ? null : this.getSections();
		return (
			<div id="modal-content">
				<i className="right fa fa-2x fa-times close-course-modal" onClick={this.props.hide}></i>
                {loader}
                {header}
                {description}
                {sections}
                {evaluations}
                {textbooks}
                {recomendations}
            </div>);
	},

	getHeader: function() {
		var course_id = this.state.course_info.id;
		var c_to_s = this.props.courses_to_sections;
		var add_or_remove = Object.keys(c_to_s).indexOf(String(course_id)) > -1 ?
		(<span className="course-action fui-check" onClick={this.toggleCourse(true)}/>) : 
		(<span className="course-action fui-plus" onClick={this.toggleCourse(false)}/>);
		var header = (<div className="modal-header">
			{add_or_remove}
			<div id="course-info-wrapper">
				<div id="name">{this.state.course_info.name}</div>
				<div id="code">{this.state.course_info.code}</div>
			</div>
		</div>);
		return header;
	},
	toggleCourse: function(removing) {
		// if removing is true, we're removing the course, if false, we're adding it
		return (function () {
			TimetableActions.updateCourses({id: this.state.course_info.id, section: '', removing: removing});
			if (!removing) {
				this.props.hide();
			}
		}.bind(this));

	},
	openRecomendation: function(course_id) {
		return (function() {
			CourseActions.getCourseInfo(this.props.school, course_id);
		}.bind(this));
	},

	getDescription: function() {
		var description = 
			(<div className="modal-entry" id="course-description">
				<h6>Description:</h6>
				{this.state.course_info.description}
			</div>)
		return description;
	},

	getEvaluations: function() {
		return <EvaluationManager eval_info={this.state.course_info.eval_info} />
	},

	getRecomendations: function() {
		var related = this.state.course_info.related_courses.slice(0,3).map(function(rc) {
            return (
            	<div className="recommendation" onClick={this.openRecomendation(rc.id)} key={rc.id}>
            		<div className="center-wrapper">
	            		<div className="rec-wrapper">
		            		<div className="name">{rc.name}</div>
		            		<div className="code">{rc.code}</div>
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
		return recomendations;
	},

	expandRecomendations: function() {

	},

	getTextbooks: function() {

		if(this.state.course_info.textbook_info[0] == undefined) {return null;}
		
		var textbook_elements = this.state.course_info.textbook_info[0].textbooks.map(function(tb) {
           
           	return (
				<a className="textbook" href={tb.detail_url} target="_blank" key={tb.id}>
	                <img height="125" src={tb.image_url}/>
	                <div className="module">
	                  <h6 className="line-clamp">{tb.title}</h6>
                  </div>
                  <img src="https://images-na.ssl-images-amazon.com/images/G/01/associates/remote-buy-box/buy5._V192207739_.gif" width="120" height="28" border="0"/>
	            </a>);

        }.bind(this));
		var textbooks = this.state.course_info.textbook_info[0].textbooks.length == 0 ? (<div id="empty-intro">No textbooks for this course yet.</div>) :
				(<div id="textbooks">
	            	{textbook_elements}
	            </div>);
		var ret = 
			(<div className="modal-entry" id="course-textbooks">
				<h6>Textbooks:</h6>
				{textbooks}
			</div>);
		return ret;
	},

	getSections: function() {
		var count = this.state.course_info.sections_S.length;
		var S = this.state.course_info.sections_S.map(function(s, i){
			return (<SectionSlot key={i}
				unique={i}
				all_sections={this.state.course_info.sections_S_objs} 
				section={s}/>)
		}.bind(this));
		var section_scroller = (<div className="empty-intro">No sections found for this course.</div>);
		if (S.length > 0) {
			section_scroller = (<SideScroller 
			slidesToShow={2}
			content={S}
			id={"sections-carousel"}/>);
		}
		var sections = 
			(<div className="modal-entry spacious-entry" id="course-sections">
				<h6>Course Sections:</h6>
				{section_scroller}
			</div>);
		return sections;
	},

	getInitialState: function() {
		return {
			show_sections: 0
		};
	},

	setShowSections: function(id) {
		return (function() {
			this.setState({show_sections: id});
		}.bind(this));
	},


});

