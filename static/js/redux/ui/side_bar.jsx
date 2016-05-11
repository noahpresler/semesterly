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
    componentWillReceiveProps(nextProps) {
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
            return <div className="tt-name" key={t.id} onClick={() => this.props.loadTimetable(t)}>{t.name}</div>
        }) : null;
        return (
            <div id="side-bar">
                <div id="sb-name">
                    <input ref="input" className={classnames("timetable-name", {"unsaved": !this.props.upToDate})}
                        value={this.state.activeTimetableName}
                        onChange={this.alterTimetableName}
                        onBlur={this.setTimetableName}
                        />
                    <span className="tip-down"></span>
                    <div id="timetable-names-dropdown"
                        >
                        <div className="tip-border"></div>
                        <div className="tip"></div>
                        <h4>Fall 2016</h4>
                        { savedTimetables }
                    </div>
                </div>
                <div id="sb-credits" className="col-1-3">
                    <h3>16</h3>
                    <h4>credits</h4>
                </div>
                <div id="sb-rating" className="col-2-3">
                    <h3>Average Course Rating</h3>
                    <div className="sub-rating-wrapper">
                        <div className="star-ratings-sprite">
                            <span className="rating"></span>
                        </div>
                    </div>
                </div>
                <h4 className="sb-header">Current Courses</h4>
                <div id="sb-master-slots">
                    <div className="master-slot">
                        <div className="slot-bar"></div>
                        <div className="master-slot-content">
                            <h3>EN.650.311</h3>
                            <h3>Discrete Mathematics</h3>
                            <h3>Baryl Castello</h3>
                            <h3>4 credits</h3>
                        </div>
                        <div className="master-slot-actions">
                            <i className="fa fa-share-alt"></i>
                            <i className="fa fa-times"></i>
                        </div>
                        <div className="master-slot-friends">
                            <div className="ms-friend">5+</div>
                            <div className="ms-friend" style={{backgroundImage: 'url(/static/img/blank.jpg)' }}></div>
                            <div className="ms-friend" style={{backgroundImage: 'url(/static/img/blank.jpg)' }}></div>
                            <div className="ms-friend" style={{backgroundImage: 'url(/static/img/blank.jpg)' }}></div>
                        </div>
                    </div>
                </div>
                <h4 className="sb-header">Optional Courses</h4>
                <div id="sb-optional-slots">
                    <div className="master-slot optional">
                        <div className="slot-bar"></div>
                        <div className="master-slot-content">
                            <h3>EN.650.311</h3>
                            <h3>Discrete Mathematics</h3>
                            <h3>Baryl Castello</h3>
                            <h3>4 credits</h3>
                        </div>
                        <div className="master-slot-actions">
                            <i className="fa fa-share-alt"></i>
                            <i className="fa fa-times"></i>
                        </div>
                        <div className="master-slot-friends">
                            <div className="ms-friend">5+</div>
                            <div className="ms-friend" style={{backgroundImage: 'url(/static/img/blank.jpg)' }}></div>
                            <div className="ms-friend" style={{backgroundImage: 'url(/static/img/blank.jpg)' }}></div>
                            <div className="ms-friend" style={{backgroundImage: 'url(/static/img/blank.jpg)' }}></div>
                        </div>
                    </div>
                </div>
                <h4 className="sb-header">Textbooks</h4>
                <div className="side-bar-section">
                    content
                </div>
            </div>
        );
    }
}

export default SideBar;
