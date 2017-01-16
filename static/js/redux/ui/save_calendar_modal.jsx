import React from 'react';
import Modal from 'boron/WaveModal';
import classNames from 'classnames';

export class SaveCalendarModal extends React.Component {
    componentDidMount() {
        if (this.props.isVisible)
            this.refs.modal.show();
    }
	componentDidUpdate(nextProps) {
		if (this.props.isVisible) {
			this.refs.modal.show();
		}
	}
	render() {
        let modalHeader =
            <div id="modal-content">
                <div id="modal-header">
                    <div className="pro-pic" style={{backgroundImage: 'url(/static/img/blank.jpg)'}}></div>
                    <h1>Add to calendar</h1>
                </div>
            </div>
        let modalStyle = {
            width: '100%'
        };
        return (
            <Modal ref="modal"
                className="signup-modal max-modal"
                modalStyle={modalStyle}
                onHide={this.props.toggleSaveCalendarModal}
                >
                {modalHeader}
                Yo
                <br />
                Yo
                <br />
                Yo
                <br />
                Yo
                <br />
                Yo
            </Modal>
        );
    }
}
