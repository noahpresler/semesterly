import React from 'react';
import Evaluation from './evaluation.jsx';
import SideScroller from './side_scroller.jsx';
import { SEMESTER_RANKS } from '../constants.jsx';

class EvaluationList extends React.Component {
	render() {
		let { evalInfo } = this.props;
		
		let navs = evalInfo
			.sort( (e1, e2) => this.evalCompare(e1, e2) )
			.map(e => (<Evaluation evalData={e} key={e.id} mini={true} />));

		let evals = evalInfo
			.sort( (e1, e2) => this.evalCompare(e1, e2) )
			.map(e => (<Evaluation evalData={e} key={e.id} />));

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

	evalCompare(e1, e2) {
		// Note that Evaluation.year is a string composing of both a semester
		// and a numerical year (e.g "Spring:2015", "Fall:2013"). We first
		// obtain the numerical year, and compare those values.
		let yearComparison = 
			e1.year.substr(e1.year.length - 4)
		    .localeCompare(e2.year.substr(e2.year.length - 4));

		// If one year is greater than another, then we return the year
		// comparison in descending lexigraphical order (i.e. "2015" < "2014").
		// Otherwise, we compare the semesters, and return that comparison in
		// ascending semester-rank order (i.e. "Winter" < "Spring" < "Fall").
		if (yearComparison != 0) {
			return -yearComparison;
		} else {
			let e1_sem = e1.year.substr(0, e1.year.length - 4); 
			let e2_sem = e2.year.substr(0, e2.year.length - 4);
			let rank1  = SEMESTER_RANKS[e1_sem];				
			let rank2  = SEMESTER_RANKS[e2_sem];
			if (rank1 < rank2) {
				return -1;
			} else if (rank1 > rank2) {
				return 1;
			} else {
				return 0
			}
		}
	}
}

export default EvaluationList;
