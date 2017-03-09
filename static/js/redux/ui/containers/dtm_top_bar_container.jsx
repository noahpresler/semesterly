import { connect } from 'react-redux';
import DTMTopBar from '../dtm_top_bar.jsx';
import { fetchShareAvailabilityLink } from '../../actions/dtm_actions.jsx'

const mapStateToProps = (state) => {
  return {
    userInfo: state.userInfo.data,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    launchShareAvailabilityModal: () => {
    	dispatch({type: "LAUNCH_SHARE_AVAILABILITY_MODAL"})
    	dispatch(fetchShareAvailabilityLink())
    }
  }
}

const DTMTopBarContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(DTMTopBar);

export default DTMTopBarContainer;
