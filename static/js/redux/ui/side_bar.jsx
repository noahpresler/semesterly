import React from 'react';
import ReactDOM from 'react-dom';

class SideBar extends React.Component {
    changeName() {
        this.props.changeName(this.refs.input.value);
    }
    render() {
        let saveButton = this.props.savingTimetable ? <i className = "fa fa-spin fa-cog" /> :
        <button className="save-timetable" onMouseDown={ this.props.saveTimetable }>Save</button>;

        return (
            <div id="side-bar">
                <div className="side-bar-header">
                  <h4>Your Semester</h4>
                </div>
                <input ref="input"
                    defaultValue={this.props.name}
                    onInput={this.changeName.bind(this)}
                    />
                { saveButton }
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
