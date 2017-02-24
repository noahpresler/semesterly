import { connect } from 'react-redux';
import TopBar from '../top_bar.jsx';
import { getSchoolSpecificInfo } from '../../constants.jsx';


const mapStateToProps = (state) => {
  let allSemesters = getSchoolSpecificInfo(state.school.school).semesters;
  return {
    userInfo: state.userInfo.data,
    currentSemester: allSemesters[state.semester]
  }
}

const TopBarContainer = connect(
  mapStateToProps,
  null
)(TopBar);

export default TopBarContainer;
