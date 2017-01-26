import React from 'react';
import Modal from 'boron/WaveModal';
import classNames from 'classnames';

export class EmailSignupModal extends React.Component {
    componentDidMount() {
        if (this.props.isVisible) {
            this.refs.modal.show();
            this.props.closeUserAcquisitionModal();
        }
    }
	componentDidUpdate(nextProps) {
		if (this.props.isVisible) {
			this.refs.modal.show();
            this.props.closeUserAcquisitionModal();
		}
	}
	render() {
        let modalHeader =
            <div id="modal-content">
                <div id="modal-header">
                    <h1>Email Login/Signup</h1>
                </div>
            </div>
        let modalStyle = {
            width: '100%'
        };
        
        return (
            <Modal ref="modal"
                className="email-signup-modal abnb-modal max-modal"
                modalStyle={modalStyle}
                onHide={() => {
                    this.props.toggleEmailSignupModal();
                    history.replaceState( {} , 'Semester.ly', '/');
                }}
                >


                <div id="save-calendar-container">
                    <h3>Signup:</h3>
                    <input className="abnb-input half left" placeholder="First Name"/>
                    <input className="abnb-input half" placeholder="Last Name"/>
                    <input className="abnb-input" placeholder="email@domain.com"/>
                    <input className="abnb-input" placeholder="Password"/>

                    <div className="or-separator">
                        <span className="h6 or-separator--text">or</span>
                        <hr />
                    </div>

                    <h3>Login:</h3>
                    <input className="abnb-input" placeholder="email@domain.com"/>
                    <input className="abnb-input" placeholder="Password"/>

                    <button className="btn abnb-btn primary twenty-px-top" onClick={() => {}}>
                        <span className="img-icon">
                            <i className="fa fa-envelope-o" />
                        </span>
                        <span>Continue with Email</span>
                    </button>

                </div>
            </Modal>
        );
    }
}
