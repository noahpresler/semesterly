import { connect } from 'react-redux';
import CreditTicker from '../credit_ticker.jsx';

const mapStateToProps = (state) => {
  let activeTimetable = state.timetables.items[state.timetables.active];
  let liveTimetableCourses = activeTimetable.courses.filter(c => !c.fake);
  return {
    numCredits: liveTimetableCourses.length > 0 ? liveTimetableCourses.reduce((prev,c) => c.num_credits + prev, 0) : 0
	}
}
const mapDispatchToProps = (dispatch) => {
  return {
  }
}

const CreditTickerContainer = connect(
	mapStateToProps,
  mapDispatchToProps
)(CreditTicker);

export default CreditTickerContainer;
