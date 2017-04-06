import {connect} from "react-redux";
import TopBar from "../top_bar.jsx";


const mapStateToProps = (state) => {
    return {
        userInfo: state.userInfo.data,
        currentSemester: allSemesters[state.semesterIndex]
    }
}

const TopBarContainer = connect(
    mapStateToProps,
    null
)(TopBar);

export default TopBarContainer;
