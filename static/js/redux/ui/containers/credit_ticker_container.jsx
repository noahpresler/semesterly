/**
Copyright (C) 2017 Semester.ly Technologies, LLC

Semester.ly is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Semester.ly is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
**/

import { connect } from 'react-redux';
import CreditTicker from '../credit_ticker';

const mapStateToProps = (state) => {
  const activeTimetable = state.timetables.items[state.timetables.active];
  const liveTimetableCourses = activeTimetable.courses.filter(c => !c.fake);
  const school = state.school.school;
  let numCredits = 0;
  if (school === 'uoft') {
    numCredits = 0.5 * liveTimetableCourses.length;
  } else {
    numCredits = liveTimetableCourses.length > 0 ? liveTimetableCourses
      .reduce((prev, c) => c.num_credits + prev, 0) : 0;
  }
  return {
    numCredits,
  };
};

const CreditTickerContainer = connect(
    mapStateToProps,
    {},
)(CreditTicker);

export default CreditTickerContainer;
