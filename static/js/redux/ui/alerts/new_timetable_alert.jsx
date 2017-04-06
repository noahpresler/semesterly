import React from "react";

class NewTimetableAlert extends React.Component {
    constructor(props) {
        super(props);
    }

    componentWillUnmount() {
        this.props.dismissSelf();
    }

    handleClick() {
        this.props.createNewTimetable();
        this.props.dismissSelf();
    }

    render() {
        return (
            <div className="conflict-alert change-semester-alert">
                { this.props.msg }

                <button
                    onClick={() => this.handleClick()}
                    className="conflict-alert-btn change-semester-btn">
                    Create Anyway
                </button>

            </div>);
    }
}
;

export default NewTimetableAlert;
