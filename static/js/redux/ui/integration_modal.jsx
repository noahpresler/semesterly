import React from 'react';
import Modal from 'boron/WaveModal';
import classNames from 'classnames';
import IntegrationSlotContainer from './containers/integration_slot_container.jsx'

export class IntegrationModal extends React.Component {
    constructor(props) {
        super(props);
        this.changeForm = this.changeForm.bind(this);
        this.enabled = false
        // this.appendSession = this.appendSession.bind(this);
        // this.removeSession = this.removeSession.bind(this);
        // this.handleChange = this.handleChange.bind(this);
        // this.json = "test";
        // this.index = 0;
    }
    componentDidUpdate(nextProps) {
        if (this.props.isVisible) {
            this.refs.modal.show();
        }
    }
    changeForm() {
        this.enabled = !this.enabled;
        console.log(this.enabled);
    }
    // appendSession() {
    //     this.setState({sessions: this.state.sessions.push(this.json)});
    // }
    // removeSession() {
    //     this.setState({sessions: this.state.sessions.splice(this.index, 1)});
    // }
    // handleChange(event) {
    //     this.setState({value: event.target.value});
    // }
    render() {
        let modalStyle = {
            width: '100%'
        };
        return (
            <Modal ref="modal"
                className="signup-modal max-modal"
                modalStyle={modalStyle}
                onHide={this.props.toggleIntegrationModal}
                >
                <div id="sessions">
                    <div className="enable pilot">
                        <div className="preference-wrapper">
                            <h3>Would you like to enable Pilot for this course?</h3>
                        </div>
                        <label className="switch switch-slide">
                            <input ref="enable_pilot" className="switch-input" type="checkbox" checked={this.enabled} onChange={this.changeForm} defaultChecked={true}/>
                            <span className="switch-label" data-on="Yes" data-off="No"></span>
                            <span className="switch-handle"></span>
                        </label>
                    </div>
                    <div id="call-to-action">
                        <a href="/login/facebook/">
                            <div  className="add-integration-button">
                                Save
                            </div>
                        </a>
                    </div>
                </div>
            </Modal>
        );
    }
}
