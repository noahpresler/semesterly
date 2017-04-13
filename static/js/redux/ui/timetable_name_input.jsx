import React from "react";
import classnames from "classnames";

class TimetableNameInput extends React.Component {
    constructor(props) {
        super(props);
        this.alterTimetableName = this.alterTimetableName.bind(this);
        this.setTimetableName = this.setTimetableName.bind(this);
        this.showSignupModal = this.showSignupModal.bind(this);
        this.state = {name: this.props.activeLoadedTimetableName};
    }

    componentWillReceiveProps(nextProps) {
        this.setState({name: nextProps.activeLoadedTimetableName});
    }

    alterTimetableName(event) {
        this.setState({name: event.target.value});
    }

    showSignupModal() {
        if (!this.props.isLoggedIn) {
            return this.props.openSignUpModal();
        }
    }

    setTimetableName() {
        let newName = this.state.name;
        if (newName.length === 0) {
            this.setState({name: this.props.activeLoadedTimetableName});
        }
        else if (newName != this.props.activeLoadedTimetableName) {
            this.props.changeTimetableName(newName);
        }
    }

    render() {
        return <input ref="input" className={classnames("timetable-name", {"unsaved": !this.props.upToDate})}
                      value={this.state.name}
                      onChange={this.alterTimetableName}
                      onBlur={this.setTimetableName}
                      onClick={this.showSignupModal}
        />
    }
}

export default TimetableNameInput;
