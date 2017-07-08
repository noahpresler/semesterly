import { connect } from 'react-redux';
import { getActiveTT } from '../../reducers/root_reducer';
import CreditTicker from '../credit_ticker';

const mapStateToProps = (state) => {
  const liveTimetableCourses = getActiveTT(state).courses.filter(c => !c.fake);
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
