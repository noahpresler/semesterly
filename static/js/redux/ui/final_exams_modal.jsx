import React from 'react';
import Slot from './slot.jsx'
import Modal from 'boron/WaveModal';
import classNames from 'classnames';

export class FinalExamsModal extends React.Component {
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
            minDate = (new Date(2017, Number(m), Number(d)) < minDate) ? new Date(2017, Number(m), Number(d)) : minDate;
        }
        return minDate;
    }
    loadFinalsToDivs() {
        let days = ['N', 'M', 'T', 'W', 'R', 'F', 'S']

        let finalsToRender = this.props.finalExamSchedule
        while (finalsToRender.length > 0) {
            let daysOfWeek = this.findDaysOfWeek(this.findFirstFinal()); // return array of the 7 days
            let weekHeadersHtml = this.generateWeekHeaders(daysOfWeek); //tke an array spit out html
            let finalsInCells = this.generateFinals(daysOfWeek)
            // remove from finalsToRender
        }

        return <div id="final-exam-calendar-ctn">
                <div id="final-exam-calender-days">
                    <h3>Sun</h3>
                    <h3>Mon</h3>
                    <h3>Tue</h3>
                    <h3>Wed</h3>
                    <h3>Thu</h3>
                    <h3>Fri</h3>
                    <h3>Sat</h3>
                </div>
                <div className="final-exam-week">
                    <div className="final-exam-day"></div>
                    <div className="final-exam-day"></div>
                    <div className="final-exam-day"></div>
                    <div className="final-exam-day"></div>
                    <div className="final-exam-day"></div>
                    <div className="final-exam-day"></div>
                    <div className="final-exam-day"></div>
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
                onHide={() => {
                    this.props.toggleFinalExamsModal();
                }}
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
