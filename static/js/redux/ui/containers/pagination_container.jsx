import {connect} from "react-redux";
import {Pagination} from "../pagination.jsx";
import {setActiveTimetable} from "../../actions/timetable_actions.jsx";

const mapStateToProps = (state) => {
    return {
        count: state.timetables.items.length,
        active: state.timetables.active,
    }
}

const PaginationContainer = connect(
    mapStateToProps,
    {
        setActive: setActiveTimetable
    }
)(Pagination);

export default PaginationContainer;
