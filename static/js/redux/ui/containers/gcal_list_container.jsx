import { connect } from 'react-redux';
import GCalList from '../gcal_list.jsx';

const mapStateToProps = (state) => {
	return {
		calendars: state.dtmCalendars.calendars
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
	}
}

const GCalListContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(GCalList);

export default GCalListContainer;
