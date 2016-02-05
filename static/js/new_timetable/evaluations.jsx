var SideScroller = require('./side_scroller.jsx');


var Evaluation = React.createClass({
	render: function() {
		var classes = this.props.mini ? "eval-item eval-mini" : "eval-item selected";
		var details = prof = null;

		if (!this.props.mini) { // only show extra information if this eval isn't mini
			// (i.e. full evaluation, not nav item for full evaluations)
			var details = (
				<div id="details">{this.props.eval_data.summary.replace(/\u00a0/g, " ")}</div>
			);
			var prof = (
				<div id="prof"><b>Professor: {this.props.eval_data.professor}</b></div>
			);
		}	
 		
		var year = this.props.eval_data.year.indexOf(":") > -1 ? 
		(this.props.eval_data.year.replace(":", " ")) :
		(this.props.eval_data.year);
		return (
		<div className={classes}>
			<div className="eval-wrapper">
				<div className="year"><b>{year}</b></div>
				{prof}
				<div className="rating-wrapper">
					<div className="star-ratings-sprite eval-stars">
						<span style={{width: 100*this.props.eval_data.score/5 + "%"}} className="rating"></span>
					</div>
					<div className="numeric-rating"><b>{"(" + this.props.eval_data.score + ")"}</b></div>
				</div>
			</div>
			{details}
		</div>);
	},
});



module.exports = React.createClass({
	

	render: function() {

		var navs = this.props.eval_info.map(function(e) {
			return (<Evaluation eval_data={e} key={e.id} mini={true} />);
		}.bind(this));

		var evals = this.props.eval_info.map(function(e) {
			return (<Evaluation eval_data={e} key={e.id} />);
		}.bind(this));

		var click_notice = this.props.eval_info.length == 0 ? (<div id="empty-intro">No course evaluations for this course yet.</div>) 
		: (<div id="click-intro">Click an evaluation item above to read the comments.</div>);
		

		var evaluation_scroller = (<div className="empty-intro">No course evaluations for this course yet.</div>);
		var custom_class = "";
		if (evals.length > 0) {
			evaluation_scroller = (<SideScroller 
			nav_items={navs}
			content={evals}
			id={"evaluations-carousel"}/>);
			custom_class = "spacious-entry";
		}

		return (
		<div className={"modal-entry " + custom_class} id="course-evaluations">
			<h6>Course Evaluations:</h6>
			{evaluation_scroller}
		</div>);
	},

});