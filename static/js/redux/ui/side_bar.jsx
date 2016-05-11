import React from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';

class SideBar extends React.Component {
    constructor(props) {
        super(props);
        this.alterTimetableName = this.alterTimetableName.bind(this);
        this.setTimetableName = this.setTimetableName.bind(this);
        this.state = { activeTimetableName: this.props.activeTimetable.name };
    }
    componentWillReceiveProps(nextProps){
        this.setState({ activeTimetableName: nextProps.activeTimetable.name });
    }
    alterTimetableName(event) {
        let newName = event.target.value;
        this.setState({ activeTimetableName: event.target.value });
    }
    setTimetableName() {
        let newName = this.state.activeTimetableName;
        if (newName.length === 0) {
            this.setState({ activeTimetableName: this.props.activeTimetable.name });
        }
        else {
            this.props.changeTimetableName(newName);
        }
    }
    render() {
        let savedTimetables = this.props.savedTimetables ? this.props.savedTimetables.map(t => {
            return <div key={t.id} onClick={() => this.props.loadTimetable(t)}>{t.name}</div>
        }) : null;
        return (
            <div id="side-bar">
                <div className="side-bar-header">
                  <h4>Your Semester</h4>
                </div>
                <input ref="input" className={classnames({"unsaved": !this.props.upToDate})}
                    value={this.state.activeTimetableName}
                    onChange={this.alterTimetableName}
                    onBlur={this.setTimetableName}
                    />
                { savedTimetables }
                <div className="col-1-2">
                    <h3>Average</h3>
                    <div className="sub-rating-wrapper">
                        <div className="star-ratings-sprite">
                            <span className="rating"></span>
                        </div>
                    </div>
                </div>
                <div className="col-1-2">
                    <h4>16</h4>
                    <h3>credits</h3>
                </div>
                <div className="side-bar-header">
                  <h4>Optional Courses</h4>
                </div>
                <div className="side-bar-section">
                    content
                    content
                    content
                    content
                    content
                    content
                </div>
                <div className="side-bar-header">
                  <h4>Textbooks</h4>
                </div>
                <div className="side-bar-section">
                    content
                    content
                    content
                    content
                    content
                    content
                </div>
            </div>
        );
    }
}

export default SideBar;
