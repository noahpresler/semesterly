import React from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';
import MasterSlot from './master_slot.jsx';
import classNames from 'classnames';
import { COLOUR_DATA } from '../constants.jsx';
import ClickOutHandler from 'react-onclickout';


class SideBar extends React.Component {
    constructor(props) {
        super(props);
        this.alterTimetableName = this.alterTimetableName.bind(this);
        this.setTimetableName = this.setTimetableName.bind(this);
        this.state = { activeTimetableName: this.props.activeLoadedTimetable.name, showDropdown: false };
        this.toggleDropdown = this.toggleDropdown.bind(this);
        this.hideDropdown = this.hideDropdown.bind(this);

    }
    hideDropdown() {
        this.setState({ showDropdown: false });
    }
    toggleDropdown() {
    	this.setState({ showDropdown: !this.state.showDropdown });
    }
    componentWillReceiveProps(nextProps) {
        this.setState({ activeTimetableName: nextProps.activeLoadedTimetable.name });
    }
    alterTimetableName(event) {
        let newName = event.target.value;
        this.setState({ activeTimetableName: event.target.value });
    }
    setTimetableName() {
        let newName = this.state.activeTimetableName;
        if (newName.length === 0) {
            this.setState({ activeTimetableName: this.props.activeLoadedTimetable.name });
        }
        else if (newName != this.props.activeLoadedTimetable.name) {
            this.props.changeTimetableName(newName);
        }
    }
    render() {
        let savedTimetables = this.props.savedTimetables ? this.props.savedTimetables.map(t => {
            return <div className="tt-name" key={t.id} onClick={() => this.props.loadTimetable(t)}>{t.name}</div>
        }) : null;
        let masterSlots = this.props.liveTimetableCourses ?
            this.props.liveTimetableCourses.map(c => {
                let colourIndex = this.props.courseToColourIndex[c.id] || 0;
                let classmates = this.props.classmates ? this.props.classmates.find(course => course.course_id === c.id) : [];
                classmates = classmates ? classmates : [];
                if (!this.props.optionalCourses.find(i => i.id === c.id)) {
                    return <MasterSlot
                            key={c.id}
                            colourIndex={colourIndex}
                            classmates={classmates}
                            onTimetable={this.props.isCourseInRoster(c.id)}
                            course={c}
                            fetchCourseInfo={() => this.props.fetchCourseInfo(c.id)}/>
                }
        }) : null;
        let optionalSlots = this.props.liveTimetableCourses ? this.props.optionalCourses.map(c => {
            let colourIndex;
            let classmates = this.props.classmates ? this.props.classmates.find(course => course.course_id === c.id) : [];
            if (this.props.liveTimetableCourses.find(course => course.id === c.id) === undefined) {
                let usedColourIndices = Object.values(this.props.courseToColourIndex);
                colourIndex = _.range(COLOUR_DATA.length).find((i) =>
                        !usedColourIndices.some((x) => x === i)
                );
            } else {
                 colourIndex = this.props.courseToColourIndex[c.id]
             }
            return <MasterSlot
                    key={c.id}
                    onTimetable={this.props.isCourseInRoster(c.id)}
                    colourIndex={colourIndex}
                    course={c}
                    fetchCourseInfo={() => this.props.fetchCourseInfo(c.id)}/>
        }) : null;
        return (
            <div id="side-bar">
                <div id="sb-name">
                    <input ref="input" className={classnames("timetable-name", {"unsaved": !this.props.upToDate})}
                        value={this.state.activeTimetableName}
                        onChange={this.alterTimetableName}
                        onBlur={this.setTimetableName}
                    />
                    <ClickOutHandler onClickOut={this.hideDropdown}>
                        <div id="timetable-drop-it-down"
                        	onMouseDown={this.toggleDropdown.bind(this)}>
                            <span className={classNames("tip-down", {'down' : this.state.showDropdown})}></span>
                        </div>
                        <div id="timetable-names-dropdown"
                        	className={classNames({'down' : this.state.showDropdown})}
                            >
                            <div className="tip-border"></div>
                            <div className="tip"></div>
                            <h4>Fall 2016</h4>
                            { savedTimetables }
                        </div>
                    </ClickOutHandler>
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
                    { masterSlots }
                </div>
                <h4 className="sb-header">Optional Courses</h4>
                    { optionalSlots }
                <div id="sb-optional-slots">
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
