import React from 'react';
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
            display = JSON.stringify(this.props.finalExamSchedule);
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
