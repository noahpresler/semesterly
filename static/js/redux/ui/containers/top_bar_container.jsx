import { connect } from 'react-redux';
import TopBar from '../top_bar';
import { currSem } from '../../reducers/semester_reducer';


const mapStateToProps = state => ({
  userInfo: state.userInfo.data,
  currentSemester: currSem(state.semester),
});

const TopBarContainer = connect(
    mapStateToProps,
)(TopBar);

export default TopBarContainer;
