import React from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';
import Reaction from './reaction.jsx'
import { REACTION_MAP } from '../constants.jsx';
import MasterSlot from './master_slot.jsx';
import Textbook from './textbook.jsx';
import { COLOUR_DATA, getSchoolSpecificInfo } from '../constants.jsx';
import EvaluationList from './evaluation_list.jsx';
import { getCourseShareLinkFromModal } from '../helpers/timetable_helpers.jsx';

export class CourseModalBody extends React.Component {
    constructor(props) {
        super(props);
        this.sendReact = this.sendReact.bind(this);
        this.fetchCourseInfo = this.fetchCourseInfo.bind(this);
        this.mobile_width = 767; // NOTE: should be static const (...ES7)
        this.state = {
            'mobile': $(window).width() < this.mobile_width
        }
    }

    componentWillMount() {
        window.addEventListener('resize', (e) => {
            if (this.state.mobile != $(window).width() < this.mobile_width) {
                this.setState({
                    'mobile': $(window).width() < this.mobile_width
                });
            }
        });
    }

    sendReact(cid, title) {
        if (this.props.isLoggedIn){
            this.props.react(cid, title);
        }
        else {
            this.props.hideModal();
            this.props.openSignupModal();
        }
    }

    mapSectionsToSlots(sections) {
        if (sections === undefined) {
            return [];
        }
        /* Begin code that seems patchworky, since db i serving up null sections?? */
        let temp = new Object();
        for(let [key, value] of Object.entries(sections))
            if (value.length > 0)
                temp[key] = value;
        sections = temp;
        /* end patchworky code */
        return Object.keys(sections).sort().map(sec =>{
            let slots = sections[sec];
            let instructors = new Set();
            for (let s of slots) {
                if (!instructors.has(s.instructors)) {
                    instructors.add(s.instructors);
                }
            }
            let instructString = Array.from(instructors).join(', ');
            let enrolled = 0
            if (slots.length > 0) {
                enrolled = slots[0] ? slots[0].enrolment || 0 : 0;
            }
            return <SearchResultSection
                    key={sec}
                    section={slots}
                    secName={sec}
                    instr={instructString}
                    enrolled={enrolled}
                    waitlist={slots[0].waitlist}
                    size={slots[0].size}
                    locked={this.props.isSectionLocked(this.props.data.id, sec)}
                    isOnActiveTimetable={this.props.isSectionOnActiveTimetable(this.props.data.id, sec)}
                    lockOrUnlock={() => this.props.addOrRemoveCourse(this.props.data.id, sec)}
                    hoverSection={() => this.props.hoverSection(this.props.data, sec)}
                    unhoverSection={this.props.unhoverSection}
                    inRoster={this.props.inRoster}
                />
        });
    }
    fetchCourseInfo(courseId) {
        if (this.props.fetchCourseInfo) {
            this.props.fetchCourseInfo(courseId);
        }
    }

    render() {
        if (this.props.isFetching) {
            return (
                <div id="modal-body">
                    <div className="cf">
                        <span className="img-icon">
                            <div className="loader"/>
                        </span>
                    </div>
                </div>
            )
        }
        let lecs = this.mapSectionsToSlots(this.props.lectureSections);
        let tuts = this.mapSectionsToSlots(this.props.tutorialSections);
        let pracs = this.mapSectionsToSlots(this.props.practicalSections);
        let lectureSections = null;
        let tutorialSections = null;
        let practicalSections = null;
        if (lecs.length > 0) {
            lectureSections = <div><h3 className="modal-module-header">Lecture Sections <small>(Hover to see the section on your timetable)</small></h3>{lecs}</div>
        }
        if (tuts.length > 0) {
            tutorialSections = <div><h3 className="modal-module-header">Tutorial Sections</h3>{tuts}</div>
        }
        if (pracs.length > 0) {
            practicalSections = <div><h3 className="modal-module-header">Lab/Practical Sections</h3>{pracs}</div>
        }
        let { reactions, num_credits:numCredits } = this.props.data;
        // reactions.sort((r1, r2) => {return r1.count < r2.count});

        let cid = this.props.data.id;
        let totalReactions = reactions.map(r => r.count).reduce( (x, y) => x + y, 0);
        if (totalReactions === 0) { totalReactions = 20; }
        let reactionsDisplay = Object.keys(REACTION_MAP).map(title => {
            let reaction = reactions.find(r => r.title === title);
            if (reaction) {
                return <Reaction
                        key={title} selected={reaction.reacted} react={() => this.sendReact(cid, title)} emoji={title} count={reaction.count} total={totalReactions}/>
            }
            else { // noone has reacted with this emoji yet
            return <Reaction
                    key={title} react={() => this.sendReact(cid, title)} emoji={title} count={0} total={totalReactions}/>
            }
        });
        reactionsDisplay.sort((r1, r2) => {return r1.props.count < r2.props.count});

        let integrationList = this.props.data.integrations;
        let evalInfo = this.props.data.eval_info;
        let relatedCourses = this.props.data.related_courses;
        let { prerequisites, textbooks } = this.props.data;
        let evals = evalInfo.length === 0 ? null :
        <div className="modal-module">
            <h3 className="modal-module-header">Course Evaluations</h3>
            {evalInfo.map((e, i) => <div key={i}>{ e }</div>)}
        </div>;
        let maxColourIndex = COLOUR_DATA.length - 1;

        let similarCourses = relatedCourses.length === 0 ? null : 
        <div className="modal-module">
            <h3 className="modal-module-header">Students Also Take</h3>
            {relatedCourses.map((rc, i) => { 
                return <MasterSlot 
                    key={i} course={rc} 
                    professors={null}
                    colourIndex={Math.min(i, maxColourIndex)}
                    onTimetable={true}
                    hideCloseButton={true}
                    inModal={true}
                    fetchCourseInfo={() => this.fetchCourseInfo(rc.id)}
                    />
            })}
        </div>
        let courseRegex = new RegExp(getSchoolSpecificInfo(school).courseRegex, "g");
        let matchedCoursesDescription = this.props.data.description.match(courseRegex);
        let description = this.props.data.description == "" ? "No description available" : this.props.data.description.split(courseRegex).map((t, i) => {
            if (matchedCoursesDescription == null)
                return t
            if (matchedCoursesDescription.indexOf(t) != -1 && Object.keys(this.props.data.regexed_courses).indexOf(t) != -1)
                return <FakeSlot key={i} num={i} code={t} name={this.props.data.regexed_courses[t]} />
            return <span className='textItem' key={i}>{t}</span>;
        });
        let matchedCoursesPrerequisites = prerequisites == null ? matchedCoursesPrerequisites = null : prerequisites.match(courseRegex);
        let newPrerequisites = (prerequisites == "" || prerequisites == null) ? "None" : prerequisites.split(courseRegex).map((t, i) => {
            if (matchedCoursesPrerequisites == null)
                return t
            if (matchedCoursesPrerequisites.indexOf(t) != -1 && Object.keys(this.props.data.regexed_courses).indexOf(t) != -1)
                return <FakeSlot key={i} num={i} code={t} name={this.props.data.regexed_courses[t]} />
            return <span className='textItem' key={i}>{t}</span>;
        });
        let prerequisitesDisplay =
        <div className="modal-module prerequisites">
            <h3 className="modal-module-header">Prerequisites</h3>
            <p>{ newPrerequisites }</p>
        </div>
        let areasDisplay =
            <div className="modal-module areas">
                <h3 className="modal-module-header">{this.props.schoolSpecificInfo.areasName}</h3>
                <p>{ this.props.data.areas || "None" }</p>
            </div>
        var integrationDivStyle = {
            backgroundImage: 'url(/static/img/integrations/pilot.png)'
        };
        let academicSupportDisplay = integrationList.indexOf('Pilot') > -1 ?
            <div className="modal-module academic-support">
                <h3 className="modal-module-header">Academic Support</h3>
                <li className="cf">
                    <span className="integration-image" style={integrationDivStyle}></span>
                    <h4>Pilot</h4>
                    <a href="http://academicsupport.jhu.edu/pilot-learning/" target="_blank">Learn More</a>
                    <p>In the PILOT program, students are organized into study teams consisting of 6-10 members who meet weekly to work problems together.</p>
                </li>
            </div> : null;
        let friendCircles = this.props.data.classmates && this.props.data.classmates.classmates.length > 0 ? this.props.data.classmates.classmates.map( c =>
                <div className="friend" key={c.img_url}>
                    <div className="ms-friend" style={{backgroundImage: 'url(' + c.img_url + ')'}}/>
                    <p title={ c.first_name + " " + c.last_name }>{ c.first_name + " " + c.last_name }</p>
                </div>) : null;
        let friendDisplay = this.props.data.classmates && this.props.data.classmates.classmates.length > 0 ?
            <div className="modal-module friends">
                <h3 className="modal-module-header">Friends In This Course</h3>
                <div id="friends-wrapper">
                    <div id="friends-inner">
                        { friendCircles }
                    </div>
                </div>
            </div> : null;
        let hasTakenCircles = this.props.data.classmates && this.props.data.classmates.past_classmates.length > 0 ? this.props.data.classmates.past_classmates.map( c =>
                <div className="friend" key={c.img_url}>
                    <div className="ms-friend" style={{backgroundImage: 'url(' + c.img_url + ')'}}/>
                    <p title={ c.first_name + " " + c.last_name }>{ c.first_name + " " + c.last_name }</p>
                </div>) : null;
        let hasTakenDisplay = this.props.data.classmates && this.props.data.classmates.past_classmates.length > 0 ?
            <div className="modal-module friends">
                <h3 className="modal-module-header">Friends Who Have Taken This Course</h3>
                <div id="friends-wrapper">
                    <div id="friends-inner">
                        { hasTakenCircles }
                    </div>
                </div>
            </div> : null;
        let textbooksDisplay = !textbooks || textbooks.length === 0 ? null :
        <div className="modal-module">
            <h3 className="modal-module-header">Textbooks</h3>
            <div className="modal-textbook-list">
                {
                    textbooks.map((t, i) => <Textbook key={i} tb={t}/>)
                }
            </div>
        </div>

        let creditsSuffix = numCredits === 1 ? " credit" : " credits";
        let avgRating = evalInfo.reduce(function(sum, e) { return sum + parseFloat(e.score); },0) / evalInfo.length;
        const show_capacity_attention = this.props.popularityPercent > 60;
        const attentioncapacityTracker = (
            <div className="capacity-tracker-wrapper">
                <div id="capacity-attention-wrapper">
                    <div id="attention-tag">
                        <div id="clock-icon">
                            <i className="fa fa-clock-o"></i>
                        </div>
                        <span>Waitlist Likely</span>
                    </div>
                    <div id="attention-text">
                        <span>
                            Over <span className="highlight">{parseInt(this.props.popularityPercent)}%</span> of seats added by students on Semesterly!
                        </span>
                    </div>
                </div>
            </div>
        );
        const capacityTracker = (
            <div className="capacity-tracker-wrapper">
                <div id="capacity-tracker-text">
                    <span>{parseInt(this.props.popularityPercent)}% of Seats Added on Semesterly</span>
                </div>
            </div>
        );
        return (
            <div id="modal-body">
                <div className="cf">
                    <div className="col-3-16">
                        <div className="credits">
                            <h3>{ numCredits }</h3>
                            <h4>{ creditsSuffix }</h4>
                        </div>
                        <div className="rating-module">
                            <h4>Average Course Rating</h4>
                            <div className="sub-rating-wrapper">
                                <div className="star-ratings-sprite">
                                    <span style={{width: 100*avgRating/5 + "%"}} className="rating"></span>
                                </div>
                            </div>
                        </div>
                        { !show_capacity_attention &&
                            capacityTracker
                        }
                        { show_capacity_attention && this.state.mobile &&
                            attentioncapacityTracker
                        }
                        { prerequisitesDisplay }
                        { areasDisplay }
                        { academicSupportDisplay }
                        { friendDisplay }
                        { hasTakenDisplay }
                    </div>
                    <div className="col-8-16">
                        { show_capacity_attention && !this.state.mobile &&
                            attentioncapacityTracker
                        }
                        <h3 className="modal-module-header">Reactions</h3>
                        <p>Check out your classmate's reactions – click an emoji to add your own opinion!</p>
                        <div id="reactions-wrapper">
                            <div id="reactions">
                                {reactionsDisplay}
                            </div>
                        </div>
                        <div>
                            <h3 className="modal-module-header">Course Description</h3>
                            <p>{description}</p>
                        </div>
                        <div className="modal-module">
                            <h3 className="modal-module-header">Course Evaluations</h3>
                            <EvaluationList evalInfo={evalInfo} />
                        </div>
                        {textbooksDisplay}
                        
                    </div>
                    <div id="modal-section-lists"
                        className="col-5-16 cf">
                        {lectureSections}
                        {tutorialSections}
                        {practicalSections}
                        {similarCourses}
                    </div>
                </div>
            </div>
        );
    }
}

const FakeSlot = ({num, code, name}) => {
    let maxColourIndex = COLOUR_DATA.length - 1;
    return <a href={getCourseShareLinkFromModal(code)} className="course-link" key={num}>
        <span>{code}</span>
        <span className="course-link-tip" style={ { backgroundColor: COLOUR_DATA[Math.min(num-1, maxColourIndex)].background }}>
            <span className="slot-bar" style={ { backgroundColor: COLOUR_DATA[Math.min(num-1, maxColourIndex)].border } }></span>
            <span className="course-link-content">
                <span>{code}</span>
                <span>{name}</span>
            </span>
        </span>
    </a>;
};

const SearchResultSection = ({ section, secName, instr, enrolled, waitlist, size, hoverSection, unhoverSection, locked, inRoster, lockOrUnlock, isOnActiveTimetable}) => {
    let seats = size - enrolled;
    let seatStatus = waitlist > 0 ? (waitlist + " waitlist") : (seats + " open");
    if (seats === -1 || size === -1) {
        seatStatus = "Unknown"
    }
    if (size === -1) {
        size = "Unknown"
    }
    let benchmark = "green";
    if (waitlist > 0) {
        benchmark = "red";
    } else if (seats === 0 && size != "Unknown") {
        benchmark = "red";
    } else if (seats < size/10) {
        benchmark = "yellow";
    }
    return (
    <div className={classnames("modal-section", {"locked": locked, "on-active-timetable": isOnActiveTimetable})}
        onMouseDown={lockOrUnlock}
        onMouseEnter={hoverSection}
        onMouseLeave={unhoverSection}>
        <h4>
            <span>{secName}</span>
            <i className="fa fa-calendar-check-o"></i>
        </h4>
        <h5>{instr}</h5>
        <h6>
            <span className={benchmark}>{seatStatus}</span>
            <span> / </span>
            <span className="total-seats">{size} seats</span>
        </h6>
        <i className="fa fa-lock"></i>
    </div>
    );
};
