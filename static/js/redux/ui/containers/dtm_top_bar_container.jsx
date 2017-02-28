import { connect } from 'react-redux';
import DTMTopBar from '../dtm_top_bar.jsx';

const mapStateToProps = (state) => {
  return {
    userInfo: state.userInfo.data,
  }
}

const DTMTopBarContainer = connect(
  mapStateToProps,
  null
)(DTMTopBar);

export default DTMTopBarContainer;
