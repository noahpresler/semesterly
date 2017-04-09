import React from "react";
import Modal from "boron/WaveModal";
import {acceptTOS} from "../actions/user_actions.jsx";

export class TermsOfServiceModal extends React.Component {
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
                    <h1>Terms of Service</h1>
                </div>
            </div>
        let modalStyle = {
            width: '100%'
        };
        console.log(this.props.userInfo);
        console.log(this.props);
        return (
            <Modal ref="modal"
                   className="terms-of-service-modal abnb-modal max-modal"
                   modalStyle={modalStyle}
                   onHide={() => {
                       this.props.toggleTermsOfServiceModal();
                   }}
            >

                {modalHeader}

                <div id="save-calendar-container">
                    <h3>Our Terms of Service has been updated. Please review them here</h3>
                    <button className="btn abnb-btn fb-btn" onClick={() => {
                        acceptTOS();
                        this.props.toggleTermsOfServiceModal();
                    }}>
                        <span className="img-icon">
                           <i className="fa fa-facebook"/>
                        </span>
                        <span>I accept the Terms of Service</span>
                    </button>
                    <p className="method-details">You must accept the new Terms of Service to continue using Semester.ly.</p>
                </div>
            </Modal>
        );
    }
}
