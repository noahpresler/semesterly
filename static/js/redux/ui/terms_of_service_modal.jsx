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
                    <h1>Terms of Service and Privacy Policy</h1>
                </div>
            </div>
        let modalStyle = {
            width: '100%'
        };
        console.log(this.props.userInfo);
        console.log(this.props);
        return (
            <Modal ref="modal"
                   className="terms-of-service-modal max-modal"
                   modalStyle={modalStyle}
                   onHide={() => {
                       this.props.toggleTermsOfServiceModal();
                   }}
            >

                {modalHeader}

                <div id="tos-container">
                    <h3>Our Terms of Service and Privacy Policy have been updated. Please review them here:</h3>
                    <div>
                        <a href="/static/termsofservice.html">
                            <span className="legal-links">Terms of Service</span>
                        </a>
                        <a href="/static/privacypolicy.htm">
                            <span>Privacy Policy</span>
                        </a>
                    </div>
                    <button className="accept-tos-btn" onClick={() => {
                        acceptTOS();
                        this.props.toggleTermsOfServiceModal();
                    }}>
                        <span className="img-icon">
                           <i className="fa fa-check"/>
                        </span>
                        <span>I accept the Terms of Service</span>
                    </button>
                    <p className="method-details">You must accept the new Terms of Service to continue using Semester.ly.</p>
                </div>
            </Modal>
        );
    }
}
