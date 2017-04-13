import React from "react";

class TimetableExistsAlert extends React.Component {
    constructor(props) {
        super(props);
    }

    componentWillUnmount() {
        this.props.dismissSelf();
    }

    handleClick() {
        this.props.turnConflictsOn();
        this.props.dismissSelf();
    }

    render() {
        return (
            <div className="timetable-exists-alert">
                You already have a timetable with that name!
            </div>);
    }
}
;

export default TimetableExistsAlert;
