import { connect } from 'react-redux';
import DTMTopBar from '../dtm_top_bar.jsx';

const mapStateToProps = (state) => {
  return {
    userInfo: state.userInfo.data,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    launchShareAvailabilityModal: () => {dispatch({type: "LAUNCH_SHARE_AVAILABILITY_MODAL"})}
  }
}

const DTMTopBarContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(DTMTopBar);

export default DTMTopBarContainer;
