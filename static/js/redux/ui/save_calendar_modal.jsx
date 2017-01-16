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
                    <div className="header-pic" style={{backgroundImage: 'url(/static/img/addtocalendarfeature.png)'}}></div>
                    <h1>Add to calendar</h1>
                </div>
            </div>
        let modalStyle = {
            width: '100%'
        };
        return (
            <Modal ref="modal"
                className="save-calendar-modal max-modal"
                modalStyle={modalStyle}
                onHide={this.props.toggleSaveCalendarModal}
                >
                {modalHeader}
                <div id="save-calendar-container">
                    <input ref="input" id="cal-name" placeholder="Semester.ly Schedule"/>
                    <button className="btn abnb-btn">
                        <span className="img-icon">
                            <img class="google-logo" src="https://a0.muscache.com/airbnb/static/signinup/google_icon_2x-745c2280e5004d4c90e3ca4e60e3f677.png" />
                        </span>
                        <span>Add to Google Calendar</span>
                    </button>
                    <p className="method-details">Add to your Google Calendar in just one click, no downloads. No importing.</p>
                    <div className="or-separator">
                        <span className="h6 or-separator--text">or</span>
                        <hr />
                    </div>
                    <button className="btn abnb-btn secondary">
                        <span className="img-icon">
                            <i className="fa fa-download" />
                        </span>
                        <span>Download Calendar</span>
                    </button>
                    <p className="method-details">Downloads a .ics file which can be uploaded to Google Calendar, loaded in to iCal., or any other calendar application.</p>
                </div>
            </Modal>
        );
    }
}
