import React from 'react';
import Slot from './slot.jsx'
import Modal from 'boron/WaveModal';
import classNames from 'classnames';

export class FinalExamsModal extends React.Component {
    constructor(props) {
        super(props);
        this.hide = this.hide.bind(this);
        this.state = {"finalsToRender": jQuery.extend(true, {}, this.props.finalExamSchedule)};
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

    findFirstFinal() {
        let finals = this.props.finalExamSchedule
        let minDate = Infinity;
        for (let course in finals) {
            let m = finals[course].split(' ')[0].split('/')['0'];
            let d = finals[course].split(' ')[0].split('/')['1'];
            minDate = (new Date(2017, Number(m - 1), Number(d)) < minDate) ? new Date(2017, Number(m - 1), Number(d)) : minDate;
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
        return <div id="final-exam-calender-days">
            { html }
        </div>
    }
    renderWeek() {

    }
    loadFinalsToDivs() {
        let days = ['N', 'M', 'T', 'W', 'R', 'F', 'S']

        let finalsToRender = jQuery.extend(true, {}, this.props.finalExamSchedule);
        let finalExamDays = []
        let daysOfWeek = this.findDaysOfWeek(this.findFirstFinal(), days)

        let weekHeadersHtml = this.generateWeekHeaders(daysOfWeek);
        for (let day in daysOfWeek) {
            let rendered = false;
            let html = "";
            for (let final in finalsToRender) {
                if (finalsToRender[final].includes(daysOfWeek[day])) {
                    html += finalsToRender[final];
                    rendered = true;
                    delete finalsToRender[final];
                }

            }
            console.log(finalsToRender);
            finalExamDays.push(<div key={day} className="final-exam-day">{ html }</div>)
        }

        while (finalsToRender.length > 0) {
            remove from finalsToRender
        }

        return <div id="final-exam-calendar-ctn">
                    { weekHeadersHtml }
                <div className="final-exam-week">
                    { finalExamDays }
                </div>
                {JSON.stringify(this.props.finalExamSchedule)}
            </div>;
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
                {modalHeader}

                <div id="modal-content">
                    {
                        display
                    }
                </div>
            </Modal>
        );
    }
}
