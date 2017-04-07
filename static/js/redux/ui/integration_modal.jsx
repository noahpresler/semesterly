import React from "react";
import Modal from "boron/WaveModal";
import {addIntegration, delIntegration, getIntegration} from "../actions/user_actions.jsx";

export class IntegrationModal extends React.Component {
    constructor(props) {
        super(props);
        this.changeForm = this.changeForm.bind(this);
        this.state = {
            enabled: this.props.enabled
        };
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
        if (this.props.isVisible != nextProps.isVisible && this.state.enabled != this.props.enabled) {
            this.setState({enabled: this.props.enabled});
        }
    }

    changeForm() {
        this.setState({enabled: !this.state.enabled});
        // getIntegration(1, this.props.course_id)
        // delIntegration(1, this.props.course_id)
        // addIntegration(1, this.props.course_id, "SHEEEIT")
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
            width: '100%',
            top: '40%'
        };
        let integrationLogo = {
            backgroundImage: 'url(/static/img/integrations/pilotLogo.png)'
        };
        return (
            <Modal ref="modal"
                   className="integration-modal narrow-modal"
                   modalStyle={modalStyle}
                   onHide={this.props.toggleIntegrationModal}
            >
                <div id="integration-modal">
                    <div id="integration-logo" style={integrationLogo}></div>
                    <div className="preference cf">
                        <label className="switch switch-slide">
                            <input ref="enable_pilot" className="switch-input" type="checkbox"
                                   checked={this.state.enabled} onChange={this.changeForm}/>
                            <span className="switch-label" data-on="Yes" data-off="No"></span>
                            <span className="switch-handle"></span>
                        </label>
                        <div className="preference-wrapper">
                            <h3>Would you like to enable Pilot for this course?</h3>
                        </div>
                    </div>
                    <div className="button-wrapper">
                        <button className="signup-button" onClick={() => {
                            if (!this.state.enabled) {
                                delIntegration(1, this.props.course_id);
                            } else {
                                addIntegration(1, this.props.course_id, "");
                            }
                            this.refs.modal.hide();
                        }}>Save
                        </button>
                    </div>
                </div>
            </Modal>
        );
    }
}
