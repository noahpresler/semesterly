/*
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
*/

import PropTypes from "prop-types";
import React from "react";
import Evaluation from "./evaluation";
import SideScroller from "./side_scroller";
import { SEMESTER_RANKS } from "../constants/constants";
import * as SemesterlyPropTypes from "../constants/semesterlyPropTypes";

class EvaluationList extends React.Component {
  static evalCompare(e1, e2) {
    // Note that Evaluation.year is a string composing of both a semester
    // and a numerical year (e.g "Spring:2015", "Fall:2013"). We first
    // obtain the numerical year, and compare those values.
    const yearComparison = e1.year
      .substr(e1.year.length - 4)
      .localeCompare(e2.year.substr(e2.year.length - 4));

    // If one year is greater than another, then we return the year
    // comparison in descending lexigraphical order (i.e. "2015" < "2014").
    // Otherwise, we compare the semesters, and return that comparison in
    // ascending semester-rank order (i.e. "Winter" < "Spring" < "Fall").
    if (yearComparison !== 0) {
      return -yearComparison;
    }
    const e1Sem = e1.year.substr(0, e1.year.length - 4);
    const e2Sem = e2.year.substr(0, e2.year.length - 4);
    const rank1 = SEMESTER_RANKS[e1Sem];
    const rank2 = SEMESTER_RANKS[e2Sem];
    if (rank1 < rank2) {
      return -1;
    } else if (rank1 > rank2) {
      return 1;
    }
    return 0;
  }

  render() {
    const evalInfo = [ ...this.props.evalInfo ];

    const navs = evalInfo
      .sort((e1, e2) => EvaluationList.evalCompare(e1, e2))
      .map((e) => <Evaluation evalData={e} key={e.id} mini />);

    const evals = evalInfo
      .sort((e1, e2) => EvaluationList.evalCompare(e1, e2))
      .map((e) => <Evaluation evalData={e} key={e.id} />);

    // console.log(navs, evals);

    let evaluationScroller = (
      <p className="empty-intro">No course evaluations for this course yet.</p>
    );

    let customClass = "";
    if (evals.length > 0) {
      evaluationScroller = (
        <SideScroller navItems={navs} content={evals} id={"evaluations-carousel"} />
      );
      customClass = "spacious-entry";
    }

    // console.log(evaluationScroller)

    return (
      <div className={`modal-entry course-evaluations ${customClass}`}>
        {evaluationScroller}
      </div>
    );
  }
}

EvaluationList.propTypes = {
  evalInfo: PropTypes.arrayOf(SemesterlyPropTypes.evaluation).isRequired,
};

export default EvaluationList;
