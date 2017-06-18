import { connect } from 'react-redux';
import TopBar from '../top_bar';
import { getCurrentSemester } from '../../reducers/root_reducer';


const mapStateToProps = state => ({
  userInfo: state.userInfo.data,
  currentSemester:
    getCurrentSemester(state),
});

const TopBarContainer = connect(
    mapStateToProps,
)(TopBar);

export default TopBarContainer;
