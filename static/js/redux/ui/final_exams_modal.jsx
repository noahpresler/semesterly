import React from 'react';
import Slot from './slot.jsx'
import Modal from 'boron/WaveModal';
import classNames from 'classnames';
import { COLOUR_DATA } from '../constants.jsx';

const InSlot = (props) => {
    let displayTime = (props.time) ? <h3 className="time">{ props.time }</h3> : null;
    let displayCode = (props.code) ? <h3 className="code">{ props.code }</h3> : null;

    if (displayTime) {
        let time = (props.time.split(" "))[1];
        let beginTime = (time.split("-"))[0];
        beginTime += beginTime > 8 && beginTime < 12 ? 'am' : 'pm';
        let endTime = (time.split("-"))[1];
        endTime +='pm';
        displayTime = <h3 className="time">{ beginTime + "-" + endTime }</h3>;
    }

    return (
        <div className={'master-slot' + ((props.numberOfFinalsAtThisTime > 1) ? ' conflict' : '')}
            style={ { backgroundColor: COLOUR_DATA[props.color].background,
                    width: (1 / props.numberOfFinalsAtThisTime) * 100 + '%' }}>
            <div className="slot-bar"
                style={ { backgroundColor: COLOUR_DATA[props.color].border } }
            ></div>
            <div className="master-slot-content">
                { displayTime }
                { displayCode }
                <h3 className="name">{ props.name }</h3>
            </div>
        </div>
    )
}

export class FinalExamsModal extends React.Component {
    constructor(props) {
        super(props);
        this.hide = this.hide.bind(this);
        this.noTimeFinals = [];
        this.finalsToRender = {};
        let mql = window.matchMedia("(orientation: portrait)");
        this.state = { 
            orientation: !mql.matches ? 'landscape' : 'portrait'
        };
        this.updateOrientation = this.updateOrientation.bind(this);
    }
    hide() {
        this.refs.modal.hide();
        history.replaceState( {} , 'Semester.ly', '/');
        if (this.props.isVisible) {
            this.props.hideFinalExamsModal();
        }
    }
    componentDidMount() {
        if (this.props.isVisible) {
            this.props.logFinalExamView();
            this.props.fetchFinalExamSchedule();
            this.noTimeFinals = [];
            this.finalsToRender = {};
            this.refs.modal.show();
            history.replaceState( {} , 'Semester.ly', '/final_exams');
        }
    }
    componentWillMount() {
        window.addEventListener('orientationchange', (e) => {
            this.updateOrientation();
        });
        window.addEventListener('resize', (e) => {
            if (!$('#search-bar-input-wrapper input').is(":focus"))
                this.updateOrientation();
        });
    }
    updateOrientation() {
        let orientation = 'portrait'
        if (window.matchMedia("(orientation: portrait)").matches) {
            orientation = 'portrait';
        } if (window.matchMedia("(orientation: landscape)").matches) {
            orientation = 'landscape';
        }
        if (orientation != this.state.orientation) {
            this.setState({orientation: orientation});
        }
    }
    componentWillUpdate(nextProps) {
        this.noTimeFinals = [];
        this.finalsToRender = {};
    }
	componentDidUpdate(nextProps) {
        if (this.props.courses != nextProps.courses && this.props.isVisible) {
            this.props.fetchFinalExamSchedule();
        }
        if (this.props.isVisible && !nextProps.isVisible) {
            this.props.logFinalExamView();
            this.noTimeFinals = [];
            this.finalsToRender = {};
			this.refs.modal.show();
            history.replaceState( {} , 'Semester.ly', '/final_exams');
		}
	}
    findNextFinalToRender(finalStack) {
        let minDate = Infinity;
        let courseCode = "";
        this.noTimeFinals = [];
        let finals = finalStack ? finalStack : this.finalsToRender
        for (let course in finals) {
            let m = finals[course].split(' ')[0].split('/')['0'];
            let d = finals[course].split(' ')[0].split('/')['1'];
            minDate = (new Date(2017, Number(m - 1), Number(d)) < minDate) ? new Date(2017, Number(m - 1), Number(d)) : minDate;
            if (finals[course].includes('Exam time not found')) {
                this.noTimeFinals.push(course);
                delete finals[course]
            }
        }
        return minDate;
    }
    findDaysOfWeek(d, days) {
        let week = []
        let firstDay = d - (d.getDay() * 24 * 60 * 60 * 1000)
        for (let d in days) {
            week.push((new Date(firstDay)).getMonth() + 1 + "/" + (new Date(firstDay)).getDate())
            firstDay = firstDay + (24 * 60 * 60 * 1000)
        }
        return week
    }
    generateWeekHeaders(dates) {
        let days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        let mobileDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']//['S', 'M', 'T', 'W', 'T', 'F', 'S']
        let html = dates.map((date, index) => {return <h3 key={date}><span className='day'>{($(window).width() > 766) ? days[index] : mobileDays[index]}</span><span className='date'>{date}</span></h3>})
        return <div id="final-exam-calender-days" className="cf">
            { html }
        </div>
    }
    renderWeek(day, days) {
        let finalExamDays = []
        let daysOfWeek = this.findDaysOfWeek(day, days)

        let weekHeadersHtml = this.generateWeekHeaders(daysOfWeek);
        for (let day in daysOfWeek) {
            let html = [];
            let conflictTime = {};
            for (let final in this.finalsToRender) {
                if (this.finalsToRender[final].includes(daysOfWeek[day])) {
                    conflictTime[this.finalsToRender[final].split(' ')[1]] = 
                        (conflictTime[this.finalsToRender[final].split(' ')[1]] == undefined) ? [final] :
                        jQuery.merge(conflictTime[this.finalsToRender[final].split(' ')[1]], [final])
                }
            }
            for (let timeFrame in conflictTime) {
                for (let final in conflictTime[timeFrame]) {
                    html.push(<InSlot name={this.props.courseDetails[conflictTime[timeFrame][final]].name}
                                    color={this.props.courseToColourIndex[conflictTime[timeFrame][final]]}
                                    time={this.finalsToRender[conflictTime[timeFrame][final]]}
                                    key={conflictTime[timeFrame][final]} 
                                    numberOfFinalsAtThisTime={conflictTime[timeFrame].length}/>)
                    delete this.finalsToRender[conflictTime[timeFrame][final]]
                }
            }
            finalExamDays.push(<div key={day} className="final-exam-day">{ html }</div>)
        }
        return <div className="final-exam-week">
                    { weekHeadersHtml }
                    <div className="final-exam-days-ctn">{ finalExamDays }</div>
                </div>

    }
    finalListHTML() {
        let days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        let finalExamDays = []
        let finalStack = jQuery.extend(true, {}, this.finalsToRender);
        while (Object.keys(finalStack).length > 0) {
            let day = this.findNextFinalToRender(finalStack)
            let html = [];
            let conflictTime = {};
            for (let final in finalStack) {
                if (finalStack[final].includes((day.getMonth() + 1) + "/" + day.getDate())) {
                    conflictTime[finalStack[final].split(' ')[1]] = 
                        (conflictTime[finalStack[final].split(' ')[1]] == undefined) ? [final] :
                        jQuery.merge(conflictTime[finalStack[final].split(' ')[1]], [final])
                }
            }
            for (let timeFrame in conflictTime) {
                for (let final in conflictTime[timeFrame]) {
                    html.push(<InSlot name={this.props.courseDetails[conflictTime[timeFrame][final]].name}
                                    color={this.props.courseToColourIndex[conflictTime[timeFrame][final]]}
                                    time={finalStack[conflictTime[timeFrame][final]]}
                                    key={conflictTime[timeFrame][final]} 
                                    numberOfFinalsAtThisTime={conflictTime[timeFrame].length}/>)
                    delete finalStack[conflictTime[timeFrame][final]]
                }
            }
            finalExamDays.push(<div key={day} className="final-exam-day">
                    <h3 className="modal-module-header">{ days[day.getDay()] + " " + (day.getMonth() + 1) + "/" + day.getDate() }</h3>
                    { html }
                </div>)
        }
        return finalExamDays
    }
    loadFinalsToDivs(mobile) {
        let days = ['N', 'M', 'T', 'W', 'R', 'F', 'S']
        this.finalsToRender = jQuery.extend(true, {}, this.props.finalExamSchedule);
        let day = this.findNextFinalToRender()

        let unscheduledFinalCtn = this.noTimeFinals.length > 0 ? 
                        <div id="final-exam-sidebar">
                            <h3 className="modal-module-header">Schedule Unavailable</h3>
                            {this.noTimeFinals.map((final, index) => {
                                return <InSlot code={this.props.courseDetails[final].code} 
                                    name={this.props.courseDetails[final].name}
                                    color={this.props.courseToColourIndex[final]}
                                    key={index} /> })}
                        </div> : null

        let finalsWeeks = []
        let finalList = this.finalListHTML()
        while (Object.keys(this.finalsToRender).length > 0) {
            finalsWeeks.push(<div key={day}>{ this.renderWeek(day, days) }</div>)
            day = new Date(day.getTime() + (7 * 24 * 60 * 60 * 1000));
        }

        let disclaimer = <p className="final-exam-disclaimer">
                                Some courses do not have finals, check with your syllabus or instructor to confirm.
                                <a href="http://web.jhu.edu/registrar/forms-pdfs/Final_Exam_Schedule_Spring_2017.pdf" target="_blank">
                                    <i className="fa fa-link" aria-hidden="true"></i>
                                    Link to registar's final exams schedule
                                </a>
                            </p>
        return (mobile) ?
            <div id="final-exam-calendar-ctn" className="mobile">
                { disclaimer }
                <div id="final-exam-main">
                    { finalList }
                </div>
                { unscheduledFinalCtn }
            </div> :
            <div id="final-exam-calendar-ctn">
                <div id="final-exam-main" className={ (unscheduledFinalCtn == null) ? "main-full" : "" }>
                    { finalsWeeks }
                </div>
                { unscheduledFinalCtn }
                { disclaimer }
            </div>
    }
	render() {
        let mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        let modalHeader =
            <div id="modal-header">
                <h1>Final Exam Schedule</h1>
                <h2>{ this.props.activeLoadedTimetableName }</h2>
                <div id="modal-close" onClick={() => this.hide()}>
                    <i className="fa fa-times"></i>
                </div>
            </div>
        let modalStyle = {
            width: '100%'
        };
        let display =
             <div id="final-exam-loader-wrapper">
                 <span className="img-icon">
                         <div className="loader"/>
                 </span>
             </div>
        if (this.props.loading) {
            // Leave as is
        } else if (this.props.hasNoCourses && !this.props.loadingCachedTT ) {
            display =
                <div className="peer-card upsell">
                    <div className="peer-card-wrapper upsell cf">
                        <h4>You Have No Courses Yet</h4>
                        <p className="description">Add courses to find your final exams in a simple and intuitive calendar form.</p>
                    </div>
                </div>
        }
        else if (this.props.hasRecievedSchedule && this.props.isVisible && !this.props.loadingCachedTT) {
            display = mobile && $(window).width() < 767 && this.state.orientation == 'portrait' ? this.loadFinalsToDivs(true) : this.loadFinalsToDivs(false);
        }
        return (
            <Modal ref="modal"
                className={ "final-exam-modal max-modal" + ((mobile) ? " is-mobile" : "") }
                modalStyle={modalStyle}
                onHide={this.hide}
                >
                <div id="modal-content">
                    { modalHeader }
                    <div id="modal-body">
                        { display }
                    </div>
                </div>
            </Modal>
        );
    }
}
