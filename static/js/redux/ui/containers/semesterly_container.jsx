import { connect } from 'react-redux';
import Semesterly from '../semesterly.jsx';

const mapStateToProps = (state) => {
	return {
    	alert_conflict: state.alerts.alert_conflict
	}
}

const SemesterlyContainer = connect(
	mapStateToProps
)(Semesterly);

export default SemesterlyContainer;
