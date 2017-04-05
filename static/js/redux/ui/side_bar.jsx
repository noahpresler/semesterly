import React from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';
import MasterSlot from './master_slot.jsx';
import classNames from 'classnames';
import { COLOUR_DATA } from '../constants.jsx';
import ClickOutHandler from 'react-onclickout';
import TimetableNameInputContainer from './containers/timetable_name_input_container.jsx';
import CreditTickerContainer from './containers/credit_ticker_container.jsx';
import Textbook from './textbook.jsx';
import Clipboard from 'clipboard';

class SideBar extends React.Component {
    constructor(props) {
        super(props);
        this.state = { showDropdown: false };
        this.toggleDropdown = this.toggleDropdown.bind(this);
        this.hideDropdown = this.hideDropdown.bind(this);
    }
    hideDropdown() {
        this.setState({ showDropdown: false });
    }
    toggleDropdown() {
    	this.setState({ showDropdown: !this.state.showDropdown });
    }
    stopPropagation(callback, event) {
        event.stopPropagation();
        this.hideDropdown();
        callback();
    }
    render() {
        let savedTimetables = this.props.savedTimetables ? this.props.savedTimetables.map(t => {
            return (
                <div className="tt-name" key={t.id} onMouseDown={() => this.props.loadTimetable(t)}>
                    {t.name}
                    <button onClick={(event) => this.stopPropagation(() => this.props.deleteTimetable(t), event)}
                            className="row-button">
                        <i className="fa fa-trash-o" />
                    </button>
                    <button onClick={(event) => this.stopPropagation(() => this.props.duplicateTimetable(t), event)}
                            className="row-button">
                        <i className="fa fa-clone" />
                    </button>
                </div>
            )
        }) : null;
        let masterSlots = this.props.mandatoryCourses ?
            this.props.mandatoryCourses.map(c => {
                let colourIndex = this.props.courseToColourIndex[c.id] || 0;
                let classmates = this.props.classmates ? this.props.classmates.find(course => course.course_id === c.id) : [];
                classmates = classmates ? classmates : [];
                let professors = []
                if (c.slots.length == 0 && c.oldSlots && c.oldSlots.length > 0) {
                    professors = [ ...new Set(c.oldSlots.map(s => s.instructors)) ];
                } else {
                    professors = [ ...new Set(c.slots.map(s => s.instructors)) ];
                }
                return <MasterSlot
                        key={c.id}
                        professors={professors}
                        colourIndex={colourIndex}
                        classmates={classmates}
                        onTimetable={this.props.isCourseInRoster(c.id)}
                        course={c}
                        fetchCourseInfo={() => this.props.fetchCourseInfo(c.id)}
                        removeCourse={() => this.props.removeCourse(c.id)}
                        />
        }) : null;
        let usedColourIndices = Object.values(this.props.courseToColourIndex);
        let optionalSlots = this.props.liveTimetableCourses ? this.props.optionalCourses.map(c => {
            let colourIndex;
            let classmates = this.props.classmates ? this.props.classmates.find(course => course.course_id === c.id) : [];
            if (Object.keys(this.props.courseToColourIndex).find(cid => cid == c.id) === undefined) {
                colourIndex = _.range(COLOUR_DATA.length).find((i) =>
                        !usedColourIndices.some((x) => x === i)
                );
                usedColourIndices[c.id] = colourIndex;
            } else {
                 colourIndex = this.props.courseToColourIndex[c.id]
             }
            return <MasterSlot
                    key={c.id}
                    onTimetable={this.props.isCourseInRoster(c.id)}
                    colourIndex={colourIndex}
                    course={c}
                    fetchCourseInfo={() => this.props.fetchCourseInfo(c.id)}
                    removeCourse={() => this.props.removeOptionalCourse(c)}/>
        }) : null;
        let dropItDown = savedTimetables && savedTimetables.length !== 0 ?
             <div id="timetable-drop-it-down"
                onMouseDown={this.toggleDropdown.bind(this)}>
                <span className={classNames("tip-down", {'down' : this.state.showDropdown})}></span>
            </div> : null;
        if (masterSlots.length === 0) {
            masterSlots = (
                <div className="empty-state">
                    <img src="/static/img/emptystates/masterslots.png" />
                    <h4>Looks like you don't have any courses yet!</h4>
                    <h3>Your selections will appear here along with credits, professors and friends in the class</h3>
                </div>);
        }
        if (optionalSlots.length === 0) {
            let img = (parseInt(masterSlots) != NaN && (masterSlots.length >= 4)) ? null : <img src="/static/img/emptystates/optionalslots.png" />;
            optionalSlots = (
                <div className="empty-state">
                    { img }
                    <h4>Give Optional Courses a Spin!</h4>
                    <h3>Load this list with courses you aren't 100% sure you want to take - we'll fit as many as possible, automatically</h3>
                </div>);
        }
        let finalScheduleLink = (masterSlots.length > 0 && school == 'jhu') ? 
            <div className="final-schedule-link"
                onClick = {this.props.launchFinalExamsModal}>
                <i className="fa fa-calendar" aria-hidden="true"></i>
                See Finals Schedule
            </div>
            : null
        return (
            <div id="side-bar" className="no-print">
                <div id="sb-name">
                    <TimetableNameInputContainer />
                    <ClickOutHandler onClickOut={this.hideDropdown}>
                        {dropItDown}
                        <div id="timetable-names-dropdown"
                        	className={classNames({'down' : this.state.showDropdown})}
                            >
                            <div className="tip-border"></div>
                            <div className="tip"></div>
                            <h4>{ this.props.semester.name + " " + this.props.semester.year }</h4>
                            { savedTimetables }
                        </div>
                    </ClickOutHandler>
                </div>
                <CreditTickerContainer />
                <div id="sb-rating" className="col-2-3">
                    <h3>Average Course Rating</h3>
                    <div className="sub-rating-wrapper">
                        <div className="star-ratings-sprite">
                            <span style={{width: 100*this.props.avgRating/5 + "%"}}
                                    className="rating">
                            </span>
                        </div>
                    </div>
                </div>
                <h4 onClick={this.props.launchPeerModal} className="sb-header">Current Courses<div id="find-friends"><i className="fa fa-users"/>&nbsp;Find new friends</div></h4>
                <h4 className="sb-tip"><b>ProTip:</b> use <i className="fa fa-lock"/> to lock a section in place.</h4>
                <div id="sb-master-slots">
                    { masterSlots }
                    { finalScheduleLink }
                </div>
                <h4 className="sb-header">Optional Courses</h4>
                    { optionalSlots }
                <div id="sb-optional-slots">
                </div>
                <h4 className="sb-header" onClick={this.props.launchTextbookModal}> Textbooks
                    <div id="find-friends"><i className="fa fa-external-link"/>&nbsp;See all</div>
                </h4>
                <div className="side-bar-section">
                    <TextbookList courses={this.props.liveTimetableCourses}/>
                </div>
            </div>
        );
    }
}

export default SideBar;

export const TextbookList = ({courses}) => {
    let tbs = [];
    for (let i = 0; i < courses.length; i++){
        if(courses[i].textbooks !== undefined && Object.keys(courses[i].textbooks).length > 0) {
            for (let j=0; j<courses[i].enrolled_sections.length; j++) {
                tbs = tbs.concat(courses[i].textbooks[courses[i].enrolled_sections[j]]);
            }
        }
    }
    let img = (parseInt(courses) != NaN && (courses.length >= 5)) ? null : <img src="/static/img/emptystates/textbooks.png" />;
    if (tbs.length === 0) {
        return (<div className="empty-state">
                { img }
                <h4>Buy & Rent Textbooks: New, Used or eBook!</h4>
                <h3>Textbooks for your classes will appear here. Click to find the lowest prices, plus FREE two day shipping with Amazon Student</h3>
            </div>);
    }
    return (
        <div>
            {_.uniq(tbs, 'isbn').map(tb => {
                return <Textbook tb={tb} key={tb.isbn} />
            })}
        </div>
    )
}

