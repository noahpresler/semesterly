import React from 'react';
import Slot from './slot.jsx'
import Modal from 'boron/WaveModal';
import classNames from 'classnames';
import { COLOUR_DATA } from '../constants.jsx';

const InSlot = (props) => {
    let displayTime = (props.time) ? <h3>{ props.time }</h3> : null
    let displayCode = (props.code) ? <h3>{ props.code }</h3> : null

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
                <h3>{ props.name }</h3>
            </div>
        </div>
    )
}

export class FinalExamsModal extends React.Component {
    constructor(props) {
        super(props);
        this.hide = this.hide.bind(this);
        this.noTimeFinals = [];
    }
    hide() {
        this.refs.modal.hide();
        if (this.props.isVisible) {
            this.props.toggleFinalExamsModal();
        }
    }
    componentDidMount() {
        if (this.props.isVisible) {
            this.props.fetchFinalExamSchedule()
            this.refs.modal.show();
        }
    }
	componentDidUpdate(nextProps) {
		if (this.props.isVisible) {
            this.props.fetchFinalExamSchedule()
			this.refs.modal.show();
		}
	}

    findNextFinalToRender(finalsToRender) {
        let finals = finalsToRender
        let minDate = Infinity;
        this.noTimeFinals = [];
        for (let course in finals) {
            let m = finals[course].split(' ')[0].split('/')['0'];
            let d = finals[course].split(' ')[0].split('/')['1'];
            minDate = (new Date(2017, Number(m - 1), Number(d)) < minDate) ? new Date(2017, Number(m - 1), Number(d)) : minDate;
            if (finals[course].includes('Exam time not found')) {
                this.noTimeFinals.push(course);
                delete finalsToRender[course]
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
        let days = ['Sun', 'Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat']
        let html = dates.map((date, index) => {return <h3 key={date}>{days[index]} {date}</h3>})
        return <div id="final-exam-calender-days" className="cf">
            { html }
        </div>
    }
    renderWeek(day, days, finalsToRender) {
        let finalExamDays = []
        let daysOfWeek = this.findDaysOfWeek(day, days)

        let weekHeadersHtml = this.generateWeekHeaders(daysOfWeek);
        for (let day in daysOfWeek) {
            let html = [];
            let conflictTime = {};
            for (let final in finalsToRender) {
                if (finalsToRender[final].includes(daysOfWeek[day])) {
                    conflictTime[finalsToRender[final].split(' ')[1]] = 
                        (conflictTime[finalsToRender[final].split(' ')[1]] == undefined) ? [final] :
                        jQuery.merge(conflictTime[finalsToRender[final].split(' ')[1]], [final])
                }
            }
            for (let timeFrame in conflictTime) {
                for (let final in conflictTime[timeFrame]) {
                    html.push(<InSlot name={this.props.courseDetails[conflictTime[timeFrame][final]].name}
                                    color={this.props.courseToColourIndex[conflictTime[timeFrame][final]]}
                                    time={finalsToRender[conflictTime[timeFrame][final]]}
                                    key={conflictTime[timeFrame][final]} 
                                    numberOfFinalsAtThisTime={conflictTime[timeFrame].length}/>)
                    delete finalsToRender[conflictTime[timeFrame][final]]
                }
            }
            console.log(conflictTime)
            finalExamDays.push(<div key={day} className="final-exam-day">{ html }</div>)
        }
        return <div className="final-exam-week">
                    { weekHeadersHtml }
                    <div className="final-exam-days-ctn">{ finalExamDays }</div>
                </div>

    }
    loadFinalsToDivs() {
        let days = ['N', 'M', 'T', 'W', 'R', 'F', 'S']
        let finalsToRender = jQuery.extend(true, {}, this.props.finalExamSchedule);
        let day = this.findNextFinalToRender(finalsToRender)

        let finalsWeeks = []
        while (Object.keys(finalsToRender).length > 0) {
            finalsWeeks.push(<div key={day}>{ this.renderWeek(day, days, finalsToRender) }</div>)
            day = new Date(day.getTime() + (7 * 24 * 60 * 60 * 1000));
        }

        let unscheduledFinal = this.noTimeFinals.map((final, index) => {
                       return <InSlot code={this.props.courseDetails[final].code} 
                            name={this.props.courseDetails[final].name}
                            color={this.props.courseToColourIndex[final]}
                            key={index} /> 
                    })

        return (this.noTimeFinals.length > 0) ? 
            <div id="final-exam-calendar-ctn">
                <div id="final-exam-main">
                    { finalsWeeks }
                </div>
                <div id="final-exam-sidebar">
                    <h3 className="modal-module-header">Schedule Unavailable</h3>
                    { unscheduledFinal }
                </div>
            </div> :
            <div id="final-exam-calendar-ctn">
                <div id="final-exam-main" className="main-full">
                    { finalsWeeks }
                </div>
            </div>
    }
	render() {
        let modalHeader =
            <div id="modal-content">
                <div id="modal-header">
                    <h1>Final Exam Scheduler</h1>
                </div>
            </div>
        let modalStyle = {
            width: '100%'
        };
        let display = "not loaded"
        if (this.props.hasRecievedSchedule) {
            display = this.loadFinalsToDivs()
        } else if (this.props.loading) {
            display = "loading"
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
