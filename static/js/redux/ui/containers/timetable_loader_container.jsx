import {connect} from "react-redux";
import TimetableLoader from "../timetable_loader";

const mapStateToProps = (state) => {
    return {
        loading: state.timetables.isFetching
    }
}
const TimetableLoaderContainer = connect(
    mapStateToProps
)(TimetableLoader);

export default TimetableLoaderContainer;
