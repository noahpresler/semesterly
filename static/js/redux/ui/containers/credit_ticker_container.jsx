import { connect } from 'react-redux';
import { getActiveTimetableCourses } from '../../reducers/root_reducer';
import CreditTicker from '../credit_ticker';

const mapStateToProps = state => ({
  numCredits: getActiveTimetableCourses(state).reduce((prev, c) => c.num_credits + prev, 0),
});

const CreditTickerContainer = connect(
    mapStateToProps,
    {},
)(CreditTicker);

export default CreditTickerContainer;
