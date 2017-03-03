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
        endTime += endTime > 8 && endTime < 12 ? 'am' : 'pm';
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
    }
    hide() {
        this.refs.modal.hide();
        if (this.props.isVisible) {
            this.props.hideFinalExamsModal();
        }
    }
    componentDidMount() {
        if (this.props.isVisible) {
            this.props.fetchFinalExamSchedule()
            this.noTimeFinals = [];
            this.finalsToRender = {};
            this.refs.modal.show();
        }
    }
    componentWillUpdate(nextProps) {
        this.noTimeFinals = [];
        this.finalsToRender = {};
    }
	componentDidUpdate(nextProps) {
		if (this.props.isVisible && !nextProps.isVisible) {
            this.props.fetchFinalExamSchedule()
            this.noTimeFinals = [];
            this.finalsToRender = {};
			this.refs.modal.show();
		}
	}
    findNextFinalToRender() {
        let minDate = Infinity;
        this.noTimeFinals = [];
        for (let course in this.finalsToRender) {
            let m = this.finalsToRender[course].split(' ')[0].split('/')['0'];
            let d = this.finalsToRender[course].split(' ')[0].split('/')['1'];
            minDate = (new Date(2017, Number(m - 1), Number(d)) < minDate) ? new Date(2017, Number(m - 1), Number(d)) : minDate;
            if (this.finalsToRender[course].includes('Exam time not found')) {
                this.noTimeFinals.push(course);
                delete this.finalsToRender[course]
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
    loadFinalsToDivs() {
        let days = ['N', 'M', 'T', 'W', 'R', 'F', 'S']
        this.finalsToRender = jQuery.extend(true, {}, this.props.finalExamSchedule);
        let day = this.findNextFinalToRender()

        let finalsWeeks = []
        while (Object.keys(this.finalsToRender).length > 0) {
            finalsWeeks.push(<div key={day}>{ this.renderWeek(day, days) }</div>)
            day = new Date(day.getTime() + (7 * 24 * 60 * 60 * 1000));
        }

        let unscheduledFinal = this.noTimeFinals.map((final, index) => {
                       return <InSlot code={this.props.courseDetails[final].code} 
                            name={this.props.courseDetails[final].name}
                            color={this.props.courseToColourIndex[final]}
                            key={index} /> 
                    })
        let disclaimer = <p className="final-exam-disclaimer">
                                Some courses do not have finals, check with your syllabus or instructor to confirm.
                                <a href="http://web.jhu.edu/registrar/forms-pdfs/Final_Exam_Schedule_Spring_2017.pdf">
                                    <i className="fa fa-link" aria-hidden="true"></i>
                                    Link to registar's final exams schedule
                                </a>
                            </p>
        return (this.noTimeFinals.length > 0) ? 
            <div id="final-exam-calendar-ctn">
                <div id="final-exam-main">
                    { finalsWeeks }
                </div>
                <div id="final-exam-sidebar">
                    <h3 className="modal-module-header">Schedule Unavailable</h3>
                    { unscheduledFinal }
                </div>
                { disclaimer }
            </div> :
            <div id="final-exam-calendar-ctn">
                <div id="final-exam-main" className="main-full">
                    { finalsWeeks }
                </div>
                { disclaimer }
            </div>
    }
	render() {
        let modalHeader =
            <div id="modal-content">
                <div id="modal-header">
                    <h1>Final Exam Scheduler</h1>
                    <h2>{ this.props.activeLoadedTimetableName }</h2>
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
        if (this.props.hasRecievedSchedule && this.props.isVisible) {
            display = this.loadFinalsToDivs()
        }
        return (
            <Modal ref="modal"
                className="final-exam-modal max-modal"
                modalStyle={modalStyle}
                onHide={this.hide}
                >
                { modalHeader }
                <div id="modal-content">
                    { display }
                </div>
            </Modal>
        );
    }
}
