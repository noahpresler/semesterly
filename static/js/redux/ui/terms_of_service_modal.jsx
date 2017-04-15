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
        let modalStyle = {
            width: '100%'
        };
        console.log(this.props.userInfo);
        console.log(this.props);
        return (
            <Modal ref="modal"
                   className="terms-of-service-modal max-modal"
                   modalStyle={modalStyle}
                   closeOnClick={false}
            >
                <div id="tos-container">
                    <h1>Terms of Service and Privacy Policy</h1>
                    <h3>Our Terms of Service and Privacy Policy have been updated. Please review them here:</h3>
                    <div>
                        <a href="/static/termsofservice.html" target='_blank' className="legal-links">Terms of Service<i className='fa fa-external-link'></i></a>
                        <a href="/static/privacypolicy.html" target='_blank' className="legal-links">Privacy Policy<i className='fa fa-external-link'></i></a>
                    </div>
                    <button className="accept-tos-btn" onClick={() => {
                            acceptTOS();
                            this.refs.modal.hide()
                        }}>
                        <i className="fa fa-check"/>
                        <span>I accept the Terms of Service</span>
                    </button>
                    <p className="method-details">You must accept the new Terms of Service to continue using Semester.ly.</p>
                </div>
            </Modal>
        );
    }
}
