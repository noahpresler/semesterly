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
            display = 
            <div id="final-exam-calendar-ctn">
                <div id="final-exam-calendar-header">
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
                        <div className="final-exam-day">
                        </div>
                        <div className="final-exam-day">
                        </div>
                        <div className="final-exam-day">
                        </div>
                        <div className="final-exam-day">
                        </div>
                        <div className="final-exam-day">
                        </div>
                        <div className="final-exam-day">
                        </div>
                        <div className="final-exam-day">
                        </div>
                        {JSON.stringify(this.props.finalExamSchedule)}
                    </div>
                </div>
            </div>
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
