import React from 'react';
import Evaluation from './evaluation.jsx';
import SideScroller from './side_scroller.jsx';

class EvaluationList extends React.Component {
	render() {
		let { evalInfo } = this.props;
		let navs = evalInfo.map(e => 
			(<Evaluation evalData={e} key={e.id} mini={true} />));

		let evals = evalInfo.map(e => 
			(<Evaluation evalData={e} key={e.id} />));
		// console.log(navs, evals);
		
		
		let evaluationScroller = <p className="empty-intro">
			No course evaluations for this course yet.
		</p>;
		let customClass = "";
		if (evals.length > 0) {
			evaluationScroller = <SideScroller 
				navItems={navs}
				content={evals}
				id={"evaluations-carousel"}/>;
			customClass = "spacious-entry";
		}
		// console.log(evaluationScroller)

		return (
		<div className={"modal-entry " + customClass} id="course-evaluations">
			{evaluationScroller}
		</div>);
	}
}

export default EvaluationList;
